package main

import (
	"math"
	"time"
)

// vim scoring point values. these mirror the client constants in
// useKeybindListener.ts and vimPenalty.ts. the client only reports which vim
// event happened (the kind below), the server owns the point values, the
// count bounds and the rate limit, so a client cannot inject its own score.
const (
	PointsArrowPenalty      = -100
	PointsMousePenalty      = -200
	PointsCounterProductive = -60
	PointsNavShortcut       = 20
	PointsNormalModeEdit    = -5
	PointsMacroUsageBase    = 50
)

// keybind_event kinds the server accepts. any other kind is rejected.
const (
	KbArrowPenalty      = "arrow_penalty"
	KbMousePenalty      = "mouse_penalty"
	KbCounterProductive = "counter_productive"
	KbNavShortcut       = "nav_shortcut"
	KbNormalEdit        = "normal_edit"
	KbMacroUsage        = "macro_usage"
)

// a single macro_usage event cannot legitimately repeat more than this many
// times ({count}@reg). it bounds a malicious or buggy client.
const MaxMacroBatch = 64

// per-player keybind_event rate limit. a human typing vim stays well under
// this, a script spamming the socket does not.
const (
	KeybindRateWindow = time.Second
	KeybindRateMax    = 60
)

// scoreKeybindEvent maps a validated event kind to its score delta and the
// keybind-count delta. only nav shortcuts and macros count toward the
// end-of-match keybind bonus. ok is false for an unknown kind. count is only
// read for macro_usage and is clamped to [1, MaxMacroBatch].
func scoreKeybindEvent(kind string, count int, macroUseCount int) (delta int, keybindDelta int, ok bool) {
	switch kind {
	case KbArrowPenalty:
		return PointsArrowPenalty, 0, true
	case KbMousePenalty:
		return PointsMousePenalty, 0, true
	case KbCounterProductive:
		return PointsCounterProductive, 0, true
	case KbNormalEdit:
		return PointsNormalModeEdit, 0, true
	case KbNavShortcut:
		// count is ignored: one shortcut is one event.
		return PointsNavShortcut, 1, true
	case KbMacroUsage:
		c := clampMacroCount(count)
		// escalating reward: the nth lifetime macro run is worth
		// base * 1.05^(n-2) starting from the 2nd run. mirrors the client
		// formula but the running count lives on the server.
		total := 0
		for i := 0; i < c; i++ {
			n := macroUseCount + i + 1
			if n >= 2 {
				total += int(math.Round(PointsMacroUsageBase * math.Pow(1.05, float64(n-2))))
			}
		}
		return total, c, true
	default:
		return 0, 0, false
	}
}

func clampMacroCount(count int) int {
	if count < 1 {
		return 1
	}
	if count > MaxMacroBatch {
		return MaxMacroBatch
	}
	return count
}
