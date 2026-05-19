package main

import "testing"

// regression: room IDs must be unique across server processes. they are the
// idempotency key for record_match_result (on conflict (room_id) do nothing).
// the old per-process counter reset to room-1 on every `go run .` restart, so
// after the first run populated room-1..N every later run's matches collided
// and were silently dropped as already_settled.
func TestRoomIDsDisjointAcrossRuns(t *testing.T) {
	run1 := &Hub{runID: newRunToken()}
	run2 := &Hub{runID: newRunToken()}

	if run1.runID == run2.runID {
		t.Fatalf("two runs produced the same run token %q", run1.runID)
	}

	seen := map[string]bool{}
	for i := 0; i < 100; i++ {
		seen[run1.NextRoomID()] = true
	}
	for i := 0; i < 100; i++ {
		id := run2.NextRoomID()
		if seen[id] {
			t.Fatalf("room id %q from run2 collides with a run1 id", id)
		}
	}
}

func TestNextRoomIDUniqueAndStableWithinRun(t *testing.T) {
	h := &Hub{runID: newRunToken()}
	seen := map[string]bool{}
	for i := 0; i < 1000; i++ {
		id := h.NextRoomID()
		if id == "" {
			t.Fatal("empty room id")
		}
		if seen[id] {
			t.Fatalf("duplicate room id within one run: %q", id)
		}
		seen[id] = true
	}
}

func TestNewRunTokenNonEmptyAndVarying(t *testing.T) {
	a, b := newRunToken(), newRunToken()
	if a == "" || b == "" {
		t.Fatal("run token is empty")
	}
	if a == b {
		t.Fatalf("run token not varying: %q == %q", a, b)
	}
}
