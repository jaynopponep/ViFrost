package main

import "testing"

// regression: an idle opponent (0 tests, 0 keybinds) must NOT receive the
// "fewest keystrokes" bonus. before the participation gate, doing nothing
// counted as maximally efficient and handed the idle player 20*opponentKb.
func TestKeybindBonusNotAwardedToIdlePlayer(t *testing.T) {
	scores := [2]int{1300, 0}
	keybinds := [2]float64{30, 0}
	passed := [2]int{1, 0} // player 0 passed a test, player 1 did nothing

	bonus := ApplyKeybindBonus(&scores, &keybinds, &passed)

	if bonus[1] != 0 {
		t.Fatalf("idle player got keybind bonus %d, want 0", bonus[1])
	}
	if scores[1] != 0 {
		t.Fatalf("idle player score moved to %d, want 0", scores[1])
	}
	if scores[0] != 1300 {
		t.Fatalf("active player score changed to %d, want 1300", scores[0])
	}
}

// the legitimate case still works: between two players who both participated,
// the one with fewer counted keybinds gets 20 * |diff|.
func TestKeybindBonusRewardsEfficientParticipant(t *testing.T) {
	scores := [2]int{1000, 1000}
	keybinds := [2]float64{5, 10}
	passed := [2]int{2, 2}

	bonus := ApplyKeybindBonus(&scores, &keybinds, &passed)

	if bonus[0] != 100 { // 20 * |5-10|
		t.Fatalf("efficient participant bonus = %d, want 100", bonus[0])
	}
	if scores[0] != 1100 {
		t.Fatalf("efficient participant score = %d, want 1100", scores[0])
	}
}

// a player who passed no tests but did use counted keybinds still counts as
// having participated, so the efficiency comparison still applies to them.
func TestKeybindBonusParticipationViaKeybinds(t *testing.T) {
	scores := [2]int{500, 500}
	keybinds := [2]float64{3, 10}
	passed := [2]int{0, 1}

	bonus := ApplyKeybindBonus(&scores, &keybinds, &passed)

	if bonus[0] != 140 { // 20 * |3-10|
		t.Fatalf("participant-via-keybinds bonus = %d, want 140", bonus[0])
	}
}
