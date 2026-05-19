package main

import (
	"math"
	"time"
)

const (
	KeybindBonusMultiplier = 20
	BaseCompletionBonus = 200.0
	FinishTimeMaxBonus = 200
	FinishTimeMultiplier = 20
	AssumedMaxFinishTimeGap = 12
)

func ApplyKeybindBonus(scores *[2]int, keybinds *[2]float64, passed *[2]int) [2]int {
	// given x = absolute difference between two players' keybind count
	// player with fewest keybinds gains (20 * x) bonus points.
	//
	// participation gate: the recipient is whoever pressed FEWER counted
	// keybinds, so an idle player (0 keybinds) is always the candidate. a
	// player who neither passed a test nor used a counted keybind did
	// nothing, and "fewest keystrokes" must not reward idling -- otherwise
	// an opponent who never touched the keyboard collects 20 * yourCount.
	keybindBonus := [2]int{}
	if keybinds[0] != keybinds[1] {
		recipient := 0
		if keybinds[1] < keybinds[0] {
			recipient = 1
		}
		participated := passed[recipient] > 0 || keybinds[recipient] > 0
		if participated {
			bonus := int(KeybindBonusMultiplier * math.Abs(keybinds[0]-keybinds[1]))
			scores[recipient] += bonus
			keybindBonus[recipient] = bonus
		}
	}
	return keybindBonus
}

func ApplyCompletionBonus(scores *[2]int, totalTests int, passed *[2]int) [2]int {
	// given x = absolute difference between two players' completion percentages
	// player with the most completion gains (200 * (1 + gap)) bonus points
	// e.g. P1 completes 20%, P2 completes 40%. gap = 0.20, P2 gains (200 * 1.2) = 240 bonus points
	completionBonus := [2]int{}
	if totalTests > 0 && passed[0] != passed[1] {
		gap := math.Abs(float64(passed[0])-float64(passed[1])) / float64(totalTests)
		bonus := int(BaseCompletionBonus * (1.0 + gap))
		if passed[0] > passed[1] {
			scores[0] += bonus
			completionBonus[0] = bonus
		} else {
			scores[1] += bonus
			completionBonus[1] = bonus
		}
	}
	return completionBonus
}

func ApplyFinishTimeBonus(scores *[2]int, submitTimes *[2]time.Time) [2]int {
	// given x = absolute difference between two players' finish times (seconds)
	// finish time rules are spread into three:
	// - <3s difference yields no bonus points
	// - 3-8s difference yields 20 * x bonus points
	// - >8s difference yields a flat 200 bonus points
	finishBonus := [2]int{}
	t0, t1 := submitTimes[0], submitTimes[1]
	if !t0.IsZero() || !t1.IsZero() {
		var first int
		var diffSec float64
		switch {
		case !t0.IsZero() && !t1.IsZero():
			diff := t0.Sub(t1).Seconds()
			if diff < 0 {
				first, diffSec = 0, -diff
			} else {
				first, diffSec = 1, diff
			}
		case !t0.IsZero():
			first, diffSec = 0, AssumedMaxFinishTimeGap
		default:
			first, diffSec = 1, AssumedMaxFinishTimeGap
		}
		var bonus int
		switch {
		case diffSec > 8:
			bonus = FinishTimeMaxBonus
		case diffSec >= 3:
			bonus = int(FinishTimeMultiplier * diffSec)
		}
		if bonus > 0 {
			scores[first] += bonus
			finishBonus[first] = bonus
		}
	}
	return finishBonus
}
