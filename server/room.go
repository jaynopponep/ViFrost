package main

import (
	"fmt"
	"math"
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
	snippet, tests, err := LoadSnippetWithTests(SnippetsDir)
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

	// Apply keybind efficiency bonus: fewer keybinds = 20 × diff bonus points
	keybindBonus := [2]int{}
	if keybinds[0] != keybinds[1] {
		bonus := int(20 * math.Abs(keybinds[0]-keybinds[1]))
		if keybinds[0] < keybinds[1] {
			scores[0] += bonus
			keybindBonus[0] = bonus
		} else {
			scores[1] += bonus
			keybindBonus[1] = bonus
		}
	}

	// Apply completion bonus: more progress = 200 * (1 + gap) bonus points
	if totalTests > 0 && passed[0] != passed[1] {
		gap := math.Abs(float64(passed[0])-float64(passed[1])) / float64(totalTests)
		bonus := int(200.0 * (1.0 + gap))
		if passed[0] > passed[1] {
			scores[0] += bonus
		} else {
			scores[1] += bonus
		}
	}

	// Apply finish-time bonus: first to submit earns points based on time gap
	t0, t1 := submitTimes[0], submitTimes[1]
	if !t0.IsZero() || !t1.IsZero() {
		var first, second int
		var diffSec float64
		switch {
		case !t0.IsZero() && !t1.IsZero():
			diff := t0.Sub(t1).Seconds()
			if diff < 0 {
				first, second, diffSec = 0, 1, -diff
			} else {
				first, second, diffSec = 1, 0, diff
			}
		case !t0.IsZero():
			first, second, diffSec = 0, 1, 21
		default:
			first, second, diffSec = 1, 0, 21
		}
		_ = second
		var bonus int
		switch {
		case diffSec > 8:
			bonus = 200
		case diffSec >= 3:
			bonus = int(20 * diffSec)
		}
		if bonus > 0 {
			scores[first] += bonus
		}
	}

	tied := scores[0] == scores[1]
	for i, p := range players {
		if p != nil {
			p.mu.Lock()
			end := EnvelopeFromType(MsgGameEnd, GameEndPayload{
				KeybindsUsed:  p.Keybinds,
				Score:         scores[i],
				OpponentScore: scores[1-i],
				Won:           !tied && scores[i] > scores[1-i],
				Tied:          tied,
				KeybindBonus:  keybindBonus[i],
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
