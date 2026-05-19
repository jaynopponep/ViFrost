package main

import (
	"time"
)

func ResetStateToRequeue(p *Player) {
	p.mu.Lock()
	p.Score = 0
	p.PassedTests = nil
	p.Keybinds = nil
	p.KeybindCount = 0
	p.Submitted = false
	p.Ready = false
	p.SubmitTime = time.Time{}
	p.Room = nil
	p.mu.Unlock()
}
