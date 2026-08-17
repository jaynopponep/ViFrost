package main

import "testing"

func TestBuildSettlePayloadWinnerAndTie(t *testing.T) {
	p1 := &Player{UserID: "u1"}
	p2 := &Player{UserID: "u2"}
	r := &Room{ID: "room-9", Mode: "ranked", Challenge: "reverse",
		Players: [2]*Player{p1, p2}}

	// p1 outscores p2 -> winner is u1.
	body := buildSettlePayload(r, [2]int{900, 400})
	if body["p_room_id"] != "room-9" || body["p_mode"] != "ranked" {
		t.Fatalf("bad room/mode: %+v", body)
	}
	if body["p_winner"] != "u1" {
		t.Fatalf("expected winner u1 got %v", body["p_winner"])
	}
	if body["p_player1_score"] != 900 || body["p_player2_score"] != 400 {
		t.Fatalf("bad scores: %+v", body)
	}

	// equal scores -> tie -> p_winner nil.
	tie := buildSettlePayload(r, [2]int{500, 500})
	if tie["p_winner"] != nil {
		t.Fatalf("tie must have nil winner, got %v", tie["p_winner"])
	}
}
