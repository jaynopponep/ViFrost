package main

import "time"

const PointsTestPass = 400

// HandleKeybind only records the keystroke and mirrors it to the opponent for
// display. scoring moved to HandleKeybindEvent (server-authoritative), so this
// path no longer changes the score and a client cannot self-score through it.
func (r *Room) HandleKeybind(from *Player, payload KeybindPayload) {
	from.mu.Lock()
	from.Keybinds = append(from.Keybinds, payload)
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

// HandleKeybindEvent applies a single client-reported vim event. the client
// only says which kind of event happened, the server decides the points, the
// count bounds and the rate limit, so the score stays server-authoritative.
func (r *Room) HandleKeybindEvent(from *Player, kind string, count int) {
	from.mu.Lock()
	now := time.Now()
	if now.Sub(from.kbWindowStart) > KeybindRateWindow {
		from.kbWindowStart = now
		from.kbWindowCount = 0
	}
	from.kbWindowCount++
	if from.kbWindowCount > KeybindRateMax {
		from.mu.Unlock()
		return
	}
	delta, keybindDelta, ok := scoreKeybindEvent(kind, count, from.macroUseCount)
	if !ok {
		from.mu.Unlock()
		return
	}
	if kind == KbMacroUsage {
		from.macroUseCount += clampMacroCount(count)
	}
	from.Score += delta
	from.KeybindCount += keybindDelta
	from.mu.Unlock()

	r.broadcastScores()
}

// HandleScoreUpdate applies a server-trusted delta (test passes) and
// rebroadcasts the authoritative totals. it is never reachable from the
// client; the client only sends keybind_event.
func (r *Room) HandleScoreUpdate(from *Player, delta int, keybindDelta int) {
	from.mu.Lock()
	from.Score += delta
	from.KeybindCount += keybindDelta
	from.mu.Unlock()

	r.broadcastScores()
}

// broadcastScores sends each player the current authoritative totals.
func (r *Room) broadcastScores() {
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

func (r *Room) HandleRunCode(from *Player, code string) {
	// the goroutine may have been scheduled just before the match ended.
	if !r.AcceptsGameplay() {
		return
	}

	// runErr is forwarded to the client for display only (syntax
	// error / traceback / timeout). it does not touch scoring or win math.
	results, runErr := RunTests(code, r.TestsContent)

	// RunTests can take up to ~10s, the match may have ended meanwhile.
	// re-check so a late run cannot mutate score or emit frames after game_end.
	if !r.AcceptsGameplay() {
		return
	}

	from.mu.Lock()
	if len(from.PassedTests) < len(results) {
		extended := make([]bool, len(results))
		copy(extended, from.PassedTests)
		from.PassedTests = extended
	}
	delta := 0
	for i, passed := range results {
		if passed && !from.PassedTests[i] {
			delta += PointsTestPass
			from.PassedTests[i] = true
		}
	}
	from.mu.Unlock()

	if delta > 0 {
		r.HandleScoreUpdate(from, delta, 0)
	}

	msg := EnvelopeFromType(MsgRunResult, RunResultPayload{
		Results: results,
		Delta:   delta,
		Error:   runErr,
	})
	select {
	case from.Send <- MustMarshal(msg):
	default:
	}

	// additive: mirror this run's pass/fail vector to the opponent so their
	// ui can show live progress. does not touch scoring/win math.
	for _, p := range r.Players {
		if p != nil && p != from {
			oppMsg := EnvelopeFromType(MsgOpponentRunResult, OpponentRunResultPayload{
				Results: results,
			})
			select {
			case p.Send <- MustMarshal(oppMsg):
			default:
			}
		}
	}
}
