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

func NewRoom(hub *Hub, p1, p2 *Player, mode string) *Room {
	roomID := hub.NextRoomID()
	c1, c2 := generateColors()
	name, snippet, tests, _, err := LoadSnippetWithTests(SnippetsDir, "")
	if err != nil {
		LogErr("failed to load snippet: %v", err)
		snippet = ""
		name = "unknown"
	}
	// mode is the pool the pair was matched in, frozen at enqueue. it is NOT
	// re-derived from p1.Mode here: a concurrent re-queue could have flipped
	// that field, which would mis-settle ELO (see settle.go p_mode).
	return &Room{
		ID:           roomID,
		Hub:          hub,
		Players:      [2]*Player{p1, p2},
		Colors:       [2]string{c1, c2},
		Snippet:      snippet,
		TestsContent: tests,
		Mode:         mode,
		Challenge:    name,
		Timer:        GameDurationSec,
		done:         make(chan struct{}),
		readyCh:      make(chan struct{}, 2),
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

	// wait for both players to ready up. there is intentionally no automatic
	// start: the match only begins once everyone has readied.
	//
	// if you guys want 15s fallback timeout (auto-start even if a player
	// never readies, so an idle or disconnected player cannot hang the room),
	// uncomment the four lines marked FALLBACK below.
	// readyDeadline := time.After(15 * time.Second) // FALLBACK
	// readyWait:                                    // FALLBACK
	for !r.bothReady() {
		select {
		case <-r.done:
			return
		case <-r.readyCh:
			// re-check loop condition
			// case <-readyDeadline: // FALLBACK
			// 	break readyWait    // FALLBACK
		}
	}

	// additive: 3..2..1 countdown then match_start
	for s := 3; s >= 1; s-- {
		select {
		case <-r.done:
			return
		default:
		}
		r.Broadcast(MustMarshal(EnvelopeFromType(MsgMatchCountdown, MatchCountdownPayload{Seconds: s})))
		time.Sleep(1 * time.Second)
	}
	r.mu.Lock()
	r.live = true
	r.mu.Unlock()
	r.Broadcast(MustMarshal(EnvelopeFromType(MsgMatchStart, nil)))

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

	// persist the result + award ELO. async + best-effort: never block or
	// crash match teardown on a Supabase hiccup.
	if r.Hub != nil {
		go settleMatch(r.Hub.cfg, r, scores)
	}

	r.Hub.RemoveRoom(r.ID)
}

func (r *Room) HandleSubmit(from *Player) {
	// the goroutine may have been scheduled just before the match ended.
	if !r.AcceptsGameplay() {
		return
	}

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

func (r *Room) HandleReady(from *Player) {
	from.mu.Lock()
	already := from.Ready
	from.Ready = true
	from.mu.Unlock()
	if already {
		return
	}
	// tell the opponent this player is ready
	for _, p := range r.Players {
		if p != nil && p != from {
			msg := EnvelopeFromType(MsgOpponentReady, nil)
			select {
			case p.Send <- MustMarshal(msg):
			default:
			}
		}
	}
	select {
	case r.readyCh <- struct{}{}:
	default:
	}
}

// AcceptsGameplay reports whether run_code/submit/keybind/score_update should
// be honored. the ready/countdown pre-game window and the post-game state both
// reject gameplay so server score cannot diverge from what the ui shows.
func (r *Room) AcceptsGameplay() bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.live && !r.ended
}

func (r *Room) bothReady() bool {
	for _, p := range r.Players {
		if p == nil {
			continue
		}
		p.mu.Lock()
		ready := p.Ready
		p.mu.Unlock()
		if !ready {
			return false
		}
	}
	return true
}

func (r *Room) PlayerIndex(p *Player) int {
	for i := range r.Players {
		if r.Players[i] == p {
			return i
		}
	}
	return -1
}
