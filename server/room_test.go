package main

import "testing"

func TestAcceptsGameplayOnlyWhenLiveAndNotEnded(t *testing.T) {
	// pre-game: room exists but the countdown has not handed off to live yet
	pre := &Room{}
	if pre.AcceptsGameplay() {
		t.Error("gameplay must be rejected before match_start (pre-game window)")
	}

	live := &Room{live: true}
	if !live.AcceptsGameplay() {
		t.Error("gameplay must be accepted while the match is live")
	}

	ended := &Room{live: true, ended: true}
	if ended.AcceptsGameplay() {
		t.Error("gameplay must be rejected after the match has ended")
	}
}
