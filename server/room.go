package main

import (
	"fmt"
	"math/rand"
	"time"
)

func generateColors() (string, string) {
	h1 := rand.Intn(360)
	h2 := rand.Intn(360)
	diff := h1 - h2
	if diff < 0 {
		diff = -diff
	}
	if diff > 180 {
		diff = 360 - diff
	}
	if diff < 60 {
		h2 = (h1 + 60 + rand.Intn(241)) % 360
	}
	return fmt.Sprintf("hsl(%d, 65%%, 55%%)", h1), fmt.Sprintf("hsl(%d, 65%%, 55%%)", h2)
}

func NewRoom(hub *Hub, p1, p2 *Player) *Room {
	roomID := hub.NextRoomID()
	c1, c2 := generateColors()
	return &Room{
		ID:      roomID,
		Hub:     hub,
		Players: [2]*Player{p1, p2},
		Colors:  [2]string{c1, c2},
		Snippet: DefaultSnippet,
		Timer:   GameDurationSec,
		done:    make(chan struct{}),
	}
}

func (r *Room) Start() {
	// match found -> Game begins
	match := EnvelopeFromType(MsgMatchFound, nil)
	r.Broadcast(MustMarshal(match))
	for i, p := range r.Players {
		if p == nil {
			continue
		}
		opponent := r.Players[1-i]
		opponentName := ""
		if opponent != nil {
			opponentName = opponent.Username
		}
		start := EnvelopeFromType(MsgGameStart, GameStartPayload{
			RoomID:        r.ID,
			Snippet:       r.Snippet,
			Duration:      GameDurationSec,
			OpponentName:  opponentName,
			PlayerColor:   r.Colors[i],
			OpponentColor: r.Colors[1-i],
		})
		select {
		case p.Send <- MustMarshal(start):
		default:
		}
	}

	ticker := time.NewTicker(TickIntervalSec * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-r.done:
			return
		case <-ticker.C:
			r.mu.Lock()
			r.Timer--
			remaining := r.Timer
			r.mu.Unlock()
			if remaining <= 0 {
				r.EndGame()
				return
			}
			tick := EnvelopeFromType(MsgTimerTick, TimerTickPayload{Remaining: remaining})
			r.Broadcast(MustMarshal(tick))
		}
	}
}

func (r *Room) Broadcast(data []byte) {
	for _, p := range r.Players {
		if p != nil {
			select {
			case p.Send <- data:
			default:
				LogErr("room %s: player send buffer full", r.ID)
			}
		}
	}
}

func (r *Room) HandleKeybind(from *Player, payload KeybindPayload) {
	from.mu.Lock()
	from.Keybinds = append(from.Keybinds, payload)
	if payload.Penalty {
		from.Score -= 1
	} else if payload.Complex {
		from.Score += 2
	} else {
		from.Score += 1
	}
	from.mu.Unlock()

	// notify opponent about keybind used
	msg := EnvelopeFromType(MsgKeybind, payload)
	data := MustMarshal(msg)
	for _, p := range r.Players {
		if p != nil && p != from {
			select {
			case p.Send <- data:
			default:
			}
		}
	}
}

func (r *Room) EndGame() {
	r.mu.Lock()
	if r.ended {
		r.mu.Unlock()
		return
	}
	r.ended = true
	close(r.done)
	players := r.Players
	r.mu.Unlock()

	for _, p := range players {
		if p != nil {
			p.mu.Lock()
			end := EnvelopeFromType(MsgGameEnd, GameEndPayload{
				KeybindsUsed: p.Keybinds,
				Score:        p.Score,
			})
			payload := MustMarshal(end)
			p.mu.Unlock()
			select {
			case p.Send <- payload:
			default:
			}
		}
	}

	r.Hub.RemoveRoom(r.ID)
}

func (r *Room) PlayerIndex(p *Player) int {
	for i := range r.Players {
		if r.Players[i] == p {
			return i
		}
	}
	return -1
}
