package main

import (
	"testing"
	"time"
)

func TestResetStateToRequeueClearsReady(t *testing.T) {
	p := &Player{
		Score:        9,
		PassedTests:  []bool{true, true},
		Keybinds:     []KeybindPayload{{Keys: "dd"}},
		KeybindCount: 4,
		Submitted:    true,
		Ready:        true,
		SubmitTime:   time.Now(),
		Room:         &Room{},
	}

	ResetStateToRequeue(p)

	if p.Ready {
		t.Error("Ready should be cleared so a requeued player must ready up again")
	}
	// guard the pre-existing resets so this fix stays net-additive
	if p.Score != 0 || p.PassedTests != nil || p.Submitted || p.Room != nil {
		t.Errorf("existing reset behavior regressed: %+v", p)
	}
}
