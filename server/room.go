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
	snippet, tests, _, err := LoadSnippetWithTests(SnippetsDir, "")
	if err != nil {
		LogErr("failed to load snippet: %v", err)
		snippet = ""
	}
	return &Room{
		ID:           roomID,
		Hub:          hub,
		Players:      [2]*Player{p1, p2},
		Colors:       [2]string{c1, c2},
		Snippet:      snippet,
		TestsContent: tests,
		Timer:        GameDurationSec,
		done:         make(chan struct{}),
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
			tick := EnvelopeFromType(MsgTimerTick, TimerTickPayload{Remaining: remaining})
			r.Broadcast(MustMarshal(tick))
			if remaining <= 0 {
				r.EndGame()
				return
			}
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

	scores := [2]int{}
	keybinds := [2]float64{}
	passed := [2]int{}
	submitTimes := [2]time.Time{}
	totalTests := 0
	for i, p := range players {
		if p != nil {
			p.mu.Lock()
			scores[i] = p.Score
			keybinds[i] = float64(p.KeybindCount)
			submitTimes[i] = p.SubmitTime
			for _, ok := range p.PassedTests {
				if ok {
					passed[i]++
				}
			}
			if n := len(p.PassedTests); n > totalTests {
				totalTests = n
			}
			p.mu.Unlock()
		}
	}

	keybindBonus := ApplyKeybindBonus(&scores, &keybinds)
	completionBonus := ApplyCompletionBonus(&scores, totalTests, &passed)
	finishBonus := ApplyFinishTimeBonus(&scores, &submitTimes)

	tied := scores[0] == scores[1]
	for i, p := range players {
		if p != nil {
			p.mu.Lock()
			end := EnvelopeFromType(MsgGameEnd, GameEndPayload{
				KeybindsUsed:       p.Keybinds,
				Score:              scores[i],
				OpponentScore:      scores[1-i],
				Won:                !tied && scores[i] > scores[1-i],
				Tied:               tied,
				KeybindBonus:       keybindBonus[i],
				CompletionBonus:    completionBonus[i],
				FinishBonus:        finishBonus[i],
				OppKeybindBonus:    keybindBonus[1-i],
				OppCompletionBonus: completionBonus[1-i],
				OppFinishBonus:     finishBonus[1-i],
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

func (r *Room) HandleSubmit(from *Player) {
	from.mu.Lock()
	if from.Submitted {
		from.mu.Unlock()
		return
	}
	from.Submitted = true
	from.SubmitTime = time.Now()
	from.mu.Unlock()

	r.mu.Lock()
	if r.Timer > SubmitTimerSec {
		r.Timer = SubmitTimerSec
	}
	remaining := r.Timer
	r.mu.Unlock()

	tick := EnvelopeFromType(MsgTimerTick, TimerTickPayload{Remaining: remaining})
	r.Broadcast(MustMarshal(tick))
}

func (r *Room) PlayerIndex(p *Player) int {
	for i := range r.Players {
		if r.Players[i] == p {
			return i
		}
	}
	return -1
}
