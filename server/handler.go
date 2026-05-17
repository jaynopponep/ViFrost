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

func (p *Player) readPump(hub *Hub) {
	defer func() {
		p.mu.Lock()
		p.active = false
		p.mu.Unlock()
		if p.Room != nil {
			p.Room.EndGame()
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
			if m, ok := e.Payload.(map[string]interface{}); ok {
				if name, ok := m["username"].(string); ok {
					p.Username = name
				}
			}
			ResetStateToRequeue(p)
			hub.Enqueue(p)
		case MsgKeybind:
			if p.Room == nil {
				sendErr(p, "not in a game")
				continue
			}
			if !p.Room.AcceptsGameplay() {
				sendErr(p, "match not in progress")
				continue
			}
			payload, ok := parseKeybindPayload(e.Payload)
			if !ok {
				sendErr(p, "invalid keybind payload")
				continue
			}
			p.Room.HandleKeybind(p, payload)
		case MsgScoreUpdate:
			if p.Room == nil {
				sendErr(p, "not in a game")
				continue
			}
			if !p.Room.AcceptsGameplay() {
				sendErr(p, "match not in progress")
				continue
			}
			delta, keybindDelta, ok := parseScoreUpdatePayload(e.Payload)
			if !ok {
				sendErr(p, "invalid score_update payload")
				continue
			}
			p.Room.HandleScoreUpdate(p, delta, keybindDelta)
		case MsgRunCode:
			if p.Room == nil {
				sendErr(p, "not in a game")
				continue
			}
			if !p.Room.AcceptsGameplay() {
				sendErr(p, "match not in progress")
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
			go p.Room.HandleRunCode(p, code)
		case MsgSubmit:
			if p.Room == nil {
				sendErr(p, "not in a game")
				continue
			}
			if !p.Room.AcceptsGameplay() {
				sendErr(p, "match not in progress")
				continue
			}
			go p.Room.HandleSubmit(p)
		case MsgPlayerReady:
			if p.Room == nil {
				sendErr(p, "not in a game")
				continue
			}
			p.Room.HandleReady(p)
		case MsgPing:
			select {
			case p.Send <- MustMarshal(EnvelopeFromType(MsgPong, nil)):
			default:
			}
		default:
		}
	}
}

func parseScoreUpdatePayload(p interface{}) (delta int, keybindDelta int, ok bool) {
	m, mOk := p.(map[string]interface{})
	if !mOk {
		return 0, 0, false
	}
	d, dOk := m["delta"].(float64)
	if !dOk {
		return 0, 0, false
	}
	kd, _ := m["keybindDelta"].(float64)
	return int(d), int(kd), true
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
