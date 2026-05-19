package main

import (
	"strconv"
	"sync"
	"sync/atomic"
)

// this file (Hub) handles matchmaking, active sessions and waiting rooms

// queuedPlayer is one enqueue attempt. mode and seq are frozen under p.mu at
// Enqueue: matchmaking routes and validates from these immutable values, never
// from the mutable p.Mode (which handler.go rewrites on every re-queue, then
// stalls in auth.verify before re-enqueuing). this is what keeps a casual
// player out of a ranked room and the ELO settle on the right K-factor.
type queuedPlayer struct {
	p    *Player
	mode string
	seq  uint64
}

type Hub struct {
	waiting chan queuedPlayer
	rooms   map[string]*Room
	roomMu  sync.RWMutex
	nextID  atomic.Uint64
	cfg     supabaseConfig
	auth    *authVerifier
}

func NewHub(cfg supabaseConfig) *Hub {
	av, err := newAuthVerifier(cfg.URL)
	if err != nil {
		LogErr("auth verifier init: %v", err)
		// fail fast: without JWKS we cannot attribute any match.
		panic(err)
	}
	h := &Hub{
		waiting: make(chan queuedPlayer, 2),
		rooms:   make(map[string]*Room),
		cfg:     cfg,
		auth:    av,
	}
	go h.matchmaking()
	return h
}

// poolEntryValid reports whether a queued entry is still a legitimate waiter:
// not superseded by a newer enqueue (seq still current), still connected, and
// not already placed in a room. it never reads the mutable p.Mode -- the mode
// was frozen into the entry at Enqueue, so a concurrent re-queue cannot
// misroute a waiter that is already pooled.
func poolEntryValid(q queuedPlayer) bool {
	q.p.mu.Lock()
	defer q.p.mu.Unlock()
	return q.seq == q.p.queueSeq && q.p.active && q.p.Room == nil
}

// removeFromAllPools drops every entry for q.p from every mode pool. a player
// has at most one valid pool membership; a prior unpaired enqueue must not
// leave a stale alias behind that a later player could be paired with.
func removeFromAllPools(queues map[string][]queuedPlayer, p *Player) {
	for m, list := range queues {
		out := list[:0]
		for _, e := range list {
			if e.p != p {
				out = append(out, e)
			}
		}
		queues[m] = out
	}
}

// enqueueForMatch adds q to its frozen mode's pool and, when that pool holds
// two distinct still-valid players, returns the paired players and the pool
// mode (the mode the room must settle with). returns (nil, "") otherwise.
// pooling and validation use only q.mode / q.seq, never the mutable p.Mode,
// so casual and ranked stay separated even under a racing re-queue.
func enqueueForMatch(queues map[string][]queuedPlayer, q queuedPlayer) ([]*Player, string) {
	q.p.mu.Lock()
	q.p.inQueue = false
	superseded := q.seq != q.p.queueSeq
	alive := q.p.active
	q.p.mu.Unlock()
	if superseded || !alive {
		// a newer enqueue already replaced this attempt, or the connection
		// dropped before this entry was processed: not a valid waiter.
		return nil, ""
	}
	// this player's only valid membership is this enqueue's mode pool. clear
	// any stale copy left by an earlier unpaired enqueue before re-adding.
	removeFromAllPools(queues, q.p)
	mode := q.mode
	queues[mode] = append(queues[mode], q)
	for len(queues[mode]) >= 2 {
		q1 := queues[mode][0]
		if !poolEntryValid(q1) {
			queues[mode] = queues[mode][1:]
			continue
		}
		q2 := queues[mode][1]
		if !poolEntryValid(q2) {
			// drop the invalid second entry, keep q1 at the head.
			queues[mode] = append(queues[mode][:1], queues[mode][2:]...)
			continue
		}
		// guard the self-play case (same authenticated user twice).
		if q1.p.UserID != "" && q1.p.UserID == q2.p.UserID {
			queues[mode] = queues[mode][1:]
			continue
		}
		queues[mode] = queues[mode][2:]
		return []*Player{q1.p, q2.p}, mode
	}
	return nil, ""
}

func (h *Hub) matchmaking() {
	queues := map[string][]queuedPlayer{}
	for q := range h.waiting {
		pair, mode := enqueueForMatch(queues, q)
		if pair == nil {
			continue
		}
		p1, p2 := pair[0], pair[1]
		room := NewRoom(h, p1, p2, mode)
		// diagnostic: prove the pool mode and each player's own mode agree.
		LogInfo("paired room=%s mode=%s p1=%s(mode=%s) p2=%s(mode=%s)",
			room.ID, mode, p1.ID, p1.Mode, p2.ID, p2.Mode)
		p1.mu.Lock()
		p1.Room = room
		p1.mu.Unlock()
		p2.mu.Lock()
		p2.Room = room
		p2.mu.Unlock()
		h.roomMu.Lock()
		h.rooms[room.ID] = room
		h.roomMu.Unlock()
		go room.Start()
	}
}

func (h *Hub) Enqueue(p *Player) {
	p.mu.Lock()
	if p.inQueue {
		p.mu.Unlock()
		return
	}
	p.inQueue = true
	// freeze the mode and generation for THIS attempt. any older entry still
	// sitting in a pool or the channel now has a stale seq and is rejected.
	p.queueSeq++
	q := queuedPlayer{p: p, mode: p.Mode, seq: p.queueSeq}
	p.mu.Unlock()
	h.waiting <- q
}

func (h *Hub) NextRoomID() string {
	n := h.nextID.Add(1)
	return "room-" + strconv.FormatUint(n, 10)
}

func (h *Hub) RemoveRoom(roomID string) {
	h.roomMu.Lock()
	delete(h.rooms, roomID)
	h.roomMu.Unlock()
}
