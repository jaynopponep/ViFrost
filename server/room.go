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
	difficulty := p1.Difficulty
	if difficulty == "" {
		difficulty = "medium"
	}
	snippet, tests, description, err := LoadSnippetWithTests(SnippetsDir, difficulty)
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
		Description:  description,
		TestsContent: tests,
		Timer:        GameDurationSec,
		done:         make(chan struct{}),
		readyCh:      make(chan struct{}, 2),
	}
}

func (r *Room) Start() {
	// Phase 1: notify both players that a match was found
	match := EnvelopeFromType(MsgMatchFound, nil)
	r.Broadcast(MustMarshal(match))

	// Phase 2: wait for both players to confirm ready (double-verify)
	readyTimeout := time.After(30 * time.Second)
	readyCount := 0
	for readyCount < 2 {
		select {
		case <-r.readyCh:
			readyCount++
		case <-readyTimeout:
			LogErr("room %s: ready timeout, ending game", r.ID)
			r.mu.Lock()
			r.endReason = "timeout"
			r.mu.Unlock()
			r.EndGame()
			return
		case <-r.done:
			return
		}
	}

	// Phase 3: send individual game_start payloads
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
			Description:   r.Description,
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

	// Phase 4: start the countdown ticker
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
				// determine winner by score before ending
				r.mu.Lock()
				r.endReason = "timeout"
				p0, p1 := r.Players[0], r.Players[1]
				r.mu.Unlock()
				if p0 != nil && p1 != nil {
					p0.mu.Lock()
					s0 := p0.Score
					p0.mu.Unlock()
					p1.mu.Lock()
					s1 := p1.Score
					p1.mu.Unlock()
					r.mu.Lock()
					if s0 > s1 {
						r.winner = p0
					} else if s1 > s0 {
						r.winner = p1
					}
					r.mu.Unlock()
				}
				r.EndGame()
				return
			}
			tick := EnvelopeFromType(MsgTimerTick, TimerTickPayload{Remaining: remaining})
			r.Broadcast(MustMarshal(tick))
		}
	}
}

func (r *Room) HandlePlayerReady() {
	select {
	case r.readyCh <- struct{}{}:
	default:
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
	// Vim movements and complex commands are neutral (0 pts).
	// Only explicit penalty signals (e.g. mouse click from frontend) cost points.
	if payload.Penalty {
		from.Score -= 20
	}
	from.mu.Unlock()

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

func (r *Room) HandleScoreUpdate(from *Player, delta int) {
	from.mu.Lock()
	from.Score += delta
	from.mu.Unlock()

	for i, p := range r.Players {
		if p == nil {
			continue
		}
		opponent := r.Players[1-i]

		p.mu.Lock()
		myScore := p.Score
		p.mu.Unlock()

		var opScore int
		if opponent != nil {
			opponent.mu.Lock()
			opScore = opponent.Score
			opponent.mu.Unlock()
		}

		msg := EnvelopeFromType(MsgScoreUpdate, ScoreUpdateServerPayload{
			MyScore:       myScore,
			OpponentScore: opScore,
		})
		select {
		case p.Send <- MustMarshal(msg):
		default:
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
	reason := r.endReason
	winner := r.winner
	r.mu.Unlock()

	for i, p := range players {
		if p == nil {
			continue
		}
		opponent := players[1-i]

		p.mu.Lock()
		myScore := p.Score
		myKeybinds := p.Keybinds
		p.mu.Unlock()

		opScore := 0
		if opponent != nil {
			opponent.mu.Lock()
			opScore = opponent.Score
			opponent.mu.Unlock()
		}

		isWinner := winner != nil && winner == p

		end := EnvelopeFromType(MsgGameEnd, GameEndPayload{
			KeybindsUsed:  myKeybinds,
			Score:         myScore,
			OpponentScore: opScore,
			IsWinner:      isWinner,
			Reason:        reason,
		})
		select {
		case p.Send <- MustMarshal(end):
		default:
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

func (r *Room) HandleRunCode(from *Player, code string) {
	results := RunTests(code, r.TestsContent)

	from.mu.Lock()
	if len(from.PassedTests) < len(results) {
		extended := make([]bool, len(results))
		copy(extended, from.PassedTests)
		from.PassedTests = extended
	}
	delta := 0
	allPassed := len(results) > 0
	for i, tr := range results {
		if tr.Passed && !from.PassedTests[i] {
			delta += 400
			from.PassedTests[i] = true
		}
		if !from.PassedTests[i] {
			allPassed = false
		}
	}
	from.mu.Unlock()

	if delta > 0 {
		r.HandleScoreUpdate(from, delta)
	}

	msg := EnvelopeFromType(MsgRunResult, RunResultPayload{
		Tests: results,
		Delta: delta,
	})
	select {
	case from.Send <- MustMarshal(msg):
	default:
	}

	if allPassed {
		// Add time bonus: finishing quickly rewards more points
		r.mu.Lock()
		timeBonus := r.Timer * 10
		r.endReason = "completion"
		r.winner = from
		r.mu.Unlock()
		if timeBonus > 0 {
			r.HandleScoreUpdate(from, timeBonus)
		}
		r.EndGame()
	}
}
