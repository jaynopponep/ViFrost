package main

const PointsTestPass = 400

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
			delta += PointsTestPass
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
		r.mu.Lock()
		r.endReason = "completion"
		r.winner = from
		r.mu.Unlock()
		r.EndGame()
	}
}
