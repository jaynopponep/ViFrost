package main

import (
	"encoding/json"
	"strings"
	"testing"
)

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

func TestGameStartPayloadCarriesProblemTitleAndStatement(t *testing.T) {
	r := &Room{
		ID:          "room-x",
		Snippet:     "def f(): pass",
		Challenge:   "minStack",
		Description: "Implement a stack with min().",
		Colors:      [2]string{"#aaa", "#bbb"},
		Players:     [2]*Player{{Username: "ada"}, {Username: "lin"}},
	}

	p0 := r.gameStartPayload(0)
	if p0.ProblemTitle != "minStack" {
		t.Errorf("ProblemTitle = %q, want %q", p0.ProblemTitle, "minStack")
	}
	if p0.ProblemStatement != "Implement a stack with min()." {
		t.Errorf("ProblemStatement = %q", p0.ProblemStatement)
	}
	if p0.OpponentName != "lin" {
		t.Errorf("OpponentName = %q, want lin", p0.OpponentName)
	}
	if p0.PlayerColor != "#aaa" || p0.OpponentColor != "#bbb" {
		t.Errorf("colors not mirrored per index: %+v", p0)
	}

	// a nil opponent must not panic and yields an empty opponent name
	solo := &Room{Players: [2]*Player{{Username: "ada"}, nil}}
	if got := solo.gameStartPayload(0).OpponentName; got != "" {
		t.Errorf("nil opponent name = %q, want empty", got)
	}

	// empty description must be omitted from the json so the frontend's
	// `?? fallback` (nullish only, not empty-string) still fires.
	r.Description = ""
	b, err := json.Marshal(r.gameStartPayload(0))
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(b), "problemStatement") {
		t.Errorf("empty description must be omitted from json, got %s", b)
	}
}
