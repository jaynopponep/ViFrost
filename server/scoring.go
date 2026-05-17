package main

const (
	PointsKeybindComplex  = 2
	PointsKeybindNormal   = 1
	PointsKeybindPenalty  = -1
	PointsTestPass        = 400
)

func (r *Room) HandleKeybind(from *Player, payload KeybindPayload) {
	from.mu.Lock()
	from.Keybinds = append(from.Keybinds, payload)
	if payload.Penalty {
		from.Score += PointsKeybindPenalty
	} else if payload.Complex {
		from.Score += PointsKeybindComplex
	} else {
		from.Score += PointsKeybindNormal
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

func (r *Room) HandleScoreUpdate(from *Player, delta int, keybindDelta int) {
	from.mu.Lock()
	from.Score += delta
	from.KeybindCount += keybindDelta
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

func (r *Room) HandleRunCode(from *Player, code string) {
	results := RunTests(code, r.TestsContent)

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
