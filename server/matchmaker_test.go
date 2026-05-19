package main

import "testing"

// enq mirrors Hub.Enqueue's capture: under p.mu it bumps the player's queue
// generation and freezes the mode that THIS enqueue attempt will be matched
// with. matchmaking must thereafter rely only on this frozen value, never on
// the mutable p.Mode (which handler.go rewrites, unlocked, on every re-queue).
func enq(q map[string][]queuedPlayer, p *Player) ([]*Player, string) {
	p.mu.Lock()
	p.inQueue = false
	p.queueSeq++
	qp := queuedPlayer{p: p, mode: p.Mode, seq: p.queueSeq}
	p.mu.Unlock()
	return enqueueForMatch(q, qp)
}

func TestPairWithinModeOnly(t *testing.T) {
	q := map[string][]queuedPlayer{}

	r1 := &Player{ID: "r1", UserID: "u-r1", Mode: "ranked", active: true}
	c1 := &Player{ID: "c1", UserID: "u-c1", Mode: "casual", active: true}
	r2 := &Player{ID: "r2", UserID: "u-r2", Mode: "ranked", active: true}

	if pair, _ := enq(q, r1); pair != nil {
		t.Fatal("should not pair on first ranked player")
	}
	if pair, _ := enq(q, c1); pair != nil {
		t.Fatal("casual must not pair with the waiting ranked player")
	}
	pair, mode := enq(q, r2)
	if pair == nil {
		t.Fatal("two ranked players must pair")
	}
	if mode != "ranked" {
		t.Fatalf("paired pool mode = %q, want ranked", mode)
	}
	if len(q["casual"]) != 1 {
		t.Fatalf("casual player should still be waiting, got %d", len(q["casual"]))
	}
}

// the room/settle mode must be the mode FROZEN at enqueue, not whatever
// p.Mode reads when the room is built. handler.go:81 rewrites p.Mode
// (unlocked) then stalls in hub.auth.verify before re-enqueuing, so a
// concurrent re-queue can flip p.Mode between pairing and NewRoom. reading
// p.Mode there mis-settles ELO (casual K-factor vs ranked +/-16).
func TestPairedModeIsFrozenAtEnqueue(t *testing.T) {
	q := map[string][]queuedPlayer{}

	p1 := &Player{ID: "p1", UserID: "u-1", Mode: "casual", active: true}
	p2 := &Player{ID: "p2", UserID: "u-2", Mode: "casual", active: true}

	if pair, _ := enq(q, p1); pair != nil {
		t.Fatal("lone casual player must not pair")
	}
	// the racy handler.go:81 write: p1's connection flips mode after it is
	// already sitting in the casual pool.
	p1.Mode = "ranked"

	pair, mode := enq(q, p2)
	if pair == nil {
		t.Fatal("two casual players must pair")
	}
	if mode != "casual" {
		t.Fatalf("paired pool mode = %q, want casual (frozen at enqueue, not the mutated p.Mode)", mode)
	}
}

// reproduces the reported bug: one connection (persistent *Player) queues
// casual, then re-queues ranked. the superseded casual entry must not linger
// where a later genuine casual player would pair with it and land in a room
// whose mode is the stale player's now-flipped "ranked".
func TestRequeueChangedModeDoesNotLeaveStalePoolEntry(t *testing.T) {
	q := map[string][]queuedPlayer{}

	p := &Player{ID: "p", UserID: "u-p", Mode: "casual", active: true}
	if pair, _ := enq(q, p); pair != nil {
		t.Fatal("lone casual player must not pair")
	}
	// same connection re-queues as ranked (handler sets p.Mode, re-enqueues).
	p.Mode = "ranked"
	if pair, _ := enq(q, p); pair != nil {
		t.Fatal("lone ranked player must not pair")
	}

	c := &Player{ID: "c", UserID: "u-c", Mode: "casual", active: true}
	if pair, _ := enq(q, c); pair != nil {
		t.Fatalf("casual paired with stale cross-mode pointer: %s+%s",
			pair[0].ID, pair[1].ID)
	}
	if n := len(q["casual"]); n != 1 {
		t.Fatalf("casual pool must hold only the new casual player, got %d", n)
	}
}

// a stale queue entry (one the player has since superseded with a newer
// enqueue) must be dropped by generation, even if it was never physically
// removed from a pool, so it cannot be paired with a fresh arrival.
func TestSupersededEnqueueEntryIsDropped(t *testing.T) {
	q := map[string][]queuedPlayer{}

	p := &Player{ID: "p", UserID: "u-p", Mode: "ranked", active: true}

	// capture a stale entry by hand (generation 1), do not feed it yet.
	p.mu.Lock()
	p.queueSeq++
	stale := queuedPlayer{p: p, mode: "ranked", seq: p.queueSeq}
	p.mu.Unlock()

	// player re-enqueues normally: generation advances to 2, sits alone.
	if pair, _ := enq(q, p); pair != nil {
		t.Fatal("lone ranked player must not pair")
	}

	// the superseded generation-1 entry arrives late off the channel. it must
	// be rejected, not paired with the live generation-2 self.
	if pair, _ := enqueueForMatch(q, stale); pair != nil {
		t.Fatalf("superseded entry was paired: %s+%s", pair[0].ID, pair[1].ID)
	}
}

// a player who disconnects while waiting alone must not be handed to the
// next live player of that mode (room would hang on the ghost).
func TestDisconnectedWaiterIsNotPaired(t *testing.T) {
	q := map[string][]queuedPlayer{}

	dead := &Player{ID: "dead", UserID: "u-d", Mode: "ranked", active: true}
	if pair, _ := enq(q, dead); pair != nil {
		t.Fatal("lone ranked player must not pair")
	}
	dead.active = false // connection drops while waiting

	live := &Player{ID: "live", UserID: "u-l", Mode: "ranked", active: true}
	if pair, _ := enq(q, live); pair != nil {
		t.Fatalf("live player paired with a disconnected waiter: %s+%s",
			pair[0].ID, pair[1].ID)
	}
}
