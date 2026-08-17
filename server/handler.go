package main

import (
	"net/http"
	"strconv"
	"sync/atomic"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{ // upgrade http to websocket
	ReadBufferSize:  ReadBuffer,
	WriteBufferSize: WriteBuffer,
	CheckOrigin:     func(r *http.Request) bool { return true },
}

var playerIDGen atomic.Uint64

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		LogErr("upgrade: %v", err)
		return
	}
	id := "player-" + strconv.FormatUint(playerIDGen.Add(1), 10)
	player := &Player{
		ID:     id,
		Conn:   conn,
		Send:   make(chan []byte, 256),
		active: true,
	}
	LogInfo("client connected: %s", player.ID)

	go player.writePump()
	player.readPump(hub)
}

// modeOrDefault normalizes the client-supplied mode; anything other than
// "ranked" falls back to "casual" (the gentler-points pool).
func modeOrDefault(m string) string {
	if m == "ranked" {
		return "ranked"
	}
	return "casual"
}

func (p *Player) readPump(hub *Hub) {
	defer func() {
		p.mu.Lock()
		p.active = false
		room := p.Room
		p.mu.Unlock()
		if room != nil {
			room.EndGame()
		}
		p.Conn.Close()
	}()
	for {
		_, raw, err := p.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				LogErr("read: %v", err)
			}
			break
		}
		e, err := UnmarshalEnvelope(raw)
		if err != nil {
			sendErr(p, "invalid message")
			continue
		}
		switch e.Type {
		case MsgJoinQueue:
			m, ok := e.Payload.(map[string]interface{})
			if !ok {
				sendErr(p, "invalid join_queue payload")
				continue
			}
			if name, ok := m["username"].(string); ok {
				p.Username = name
			}
			// guarded: the matchmaking goroutine freezes this under p.mu at
			// Enqueue. an unlocked write here races that read (handler.go and
			// matchmaking are separate goroutines on the same *Player).
			rawMode := asString(m["mode"])
			p.mu.Lock()
			p.Mode = modeOrDefault(rawMode)
			p.mu.Unlock()
			// diagnostic: ground truth for what each client actually queued.
			LogInfo("join_queue player=%s raw=%q normalized=%s", p.ID, rawMode, p.Mode)
			// identity: the JWT sub is the player's profiles.id. without a
			// valid token the match cannot be attributed, so refuse to queue.
			token := asString(m["token"])
			uid, verr := hub.auth.verify(token)
			if verr != nil {
				LogErr("join_queue auth failed for %s: %v", p.ID, verr)
				sendErr(p, "authentication required to queue")
				continue
			}
			p.UserID = uid
			// if still in a room, end it first. otherwise the abandoned room
			// keeps running and broadcasts old game messages into this
			// player's channel after they join a new match.
			if old := p.room(); old != nil {
				old.EndGame()
			}
			ResetStateToRequeue(p)
			hub.Enqueue(p)
		case MsgKeybind:
			room := p.room()
			if room == nil {
				sendErr(p, "not in a game")
				continue
			}
			if !room.AcceptsGameplay() {
				sendErr(p, "match not in progress")
				continue
			}
			payload, ok := parseKeybindPayload(e.Payload)
			if !ok {
				sendErr(p, "invalid keybind payload")
				continue
			}
			room.HandleKeybind(p, payload)
		case MsgKeybindEvent:
			room := p.room()
			if room == nil {
				sendErr(p, "not in a game")
				continue
			}
			if !room.AcceptsGameplay() {
				sendErr(p, "match not in progress")
				continue
			}
			// a player who already submitted is locked out of further scoring.
			if p.hasSubmitted() {
				continue
			}
			kind, count, ok := parseKeybindEventPayload(e.Payload)
			if !ok {
				sendErr(p, "invalid keybind_event payload")
				continue
			}
			room.HandleKeybindEvent(p, kind, count)
		case MsgRunCode:
			room := p.room()
			if room == nil {
				sendErr(p, "not in a game")
				continue
			}
			if !room.AcceptsGameplay() {
				sendErr(p, "match not in progress")
				continue
			}
			if p.hasSubmitted() {
				sendErr(p, "already submitted")
				continue
			}
			m, ok := e.Payload.(map[string]interface{})
			if !ok {
				sendErr(p, "invalid run_code payload")
				continue
			}
			code, ok := m["code"].(string)
			if !ok {
				sendErr(p, "invalid run_code payload")
				continue
			}
			go room.HandleRunCode(p, code)
		case MsgSubmit:
			room := p.room()
			if room == nil {
				sendErr(p, "not in a game")
				continue
			}
			if !room.AcceptsGameplay() {
				sendErr(p, "match not in progress")
				continue
			}
			go room.HandleSubmit(p)
		case MsgPlayerReady:
			room := p.room()
			if room == nil {
				sendErr(p, "not in a game")
				continue
			}
			room.HandleReady(p)
		case MsgPing:
			select {
			case p.Send <- MustMarshal(EnvelopeFromType(MsgPong, nil)):
			default:
			}
		default:
		}
	}
}

// room returns the player's current room under the lock. the matchmaking
// goroutine writes p.Room while readPump reads it, so the read must be guarded.
func (p *Player) room() *Room {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.Room
}

func (p *Player) hasSubmitted() bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.Submitted
}

func parseKeybindEventPayload(p interface{}) (kind string, count int, ok bool) {
	m, mOk := p.(map[string]interface{})
	if !mOk {
		return "", 0, false
	}
	k, kOk := m["kind"].(string)
	if !kOk || k == "" {
		return "", 0, false
	}
	count = 1
	if v, vOk := m["count"].(float64); vOk {
		count = int(v)
	}
	return k, count, true
}

func parseKeybindPayload(p interface{}) (KeybindPayload, bool) {
	if p == nil {
		return KeybindPayload{}, false
	}
	m, ok := p.(map[string]interface{})
	if !ok {
		return KeybindPayload{}, false
	}
	var k KeybindPayload
	if v, ok := m["keys"].(string); ok {
		k.Keys = v
	}
	if v, ok := m["complex"].(bool); ok {
		k.Complex = v
	}
	if v, ok := m["penalty"].(bool); ok {
		k.Penalty = v
	}
	return k, true
}

func sendErr(p *Player, msg string) {
	e := EnvelopeFromType(MsgError, ErrorPayload{Message: msg})
	select {
	case p.Send <- MustMarshal(e):
	default:
	}
}

func (p *Player) writePump() {
	defer p.Conn.Close()
	for data := range p.Send {
		if err := p.Conn.WriteMessage(websocket.TextMessage, data); err != nil {
			LogErr("write: %v", err)
			return
		}
	}
}

// asString safely extracts a string from a decoded JSON map value.
func asString(v interface{}) string {
	s, _ := v.(string)
	return s
}
