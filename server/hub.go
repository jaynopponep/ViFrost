package main

import (
	"strconv"
	"sync"
	"sync/atomic"
	"time"
)

// Hub handles matchmaking, active rooms, and connected-player tracking.
type Hub struct {
	mu        sync.Mutex
	queue     []*Player
	rooms     map[string]*Room
	roomMu    sync.RWMutex
	nextID    atomic.Uint64
	connected atomic.Int64
	signal    chan struct{}
}

func NewHub() *Hub {
	h := &Hub{
		rooms:  make(map[string]*Room),
		signal: make(chan struct{}, 1),
	}
	go h.matchmaking()
	go h.statsBroadcaster()
	return h
}

func (h *Hub) matchmaking() {
	for range h.signal {
		h.mu.Lock()

		// Remove players that disconnected while waiting.
		live := h.queue[:0]
		for _, p := range h.queue {
			p.mu.Lock()
			alive := p.active
			p.mu.Unlock()
			if alive {
				live = append(live, p)
			}
		}
		h.queue = live

		// Pair up as many players as possible, preferring same-difficulty matches.
		for len(h.queue) >= 2 {
			p1, p2 := h.matchBestPair()
			if p1 == nil {
				break
			}

			room := NewRoom(h, p1, p2)
			p1.Room = room
			p2.Room = room

			h.roomMu.Lock()
			h.rooms[room.ID] = room
			h.roomMu.Unlock()

			// Run Start in a goroutine so the matchmaking loop is never blocked.
			go room.Start()
		}

		queueCopy := make([]*Player, len(h.queue))
		copy(queueCopy, h.queue)
		qLen := len(h.queue)
		h.mu.Unlock()

		h.sendStatsTo(queueCopy, qLen)
	}
}

// Enqueue adds a player to the waiting queue and triggers the matchmaker.
// Duplicate entries are silently ignored.
func (h *Hub) Enqueue(p *Player) {
	h.mu.Lock()
	for _, existing := range h.queue {
		if existing == p {
			h.mu.Unlock()
			h.triggerMatch()
			return
		}
	}
	h.queue = append(h.queue, p)
	h.mu.Unlock()
	h.triggerMatch()
}

func (h *Hub) triggerMatch() {
	select {
	case h.signal <- struct{}{}:
	default:
	}
}

// sendStatsTo pushes a queue_stats message to every player still in queue.
func (h *Hub) sendStatsTo(players []*Player, qLen int) {
	stats := EnvelopeFromType(MsgQueueStats, QueueStatsPayload{
		PlayersOnline: int(h.connected.Load()),
		InQueue:       qLen,
	})
	data := MustMarshal(stats)
	for _, p := range players {
		select {
		case p.Send <- data:
		default:
		}
	}
}

// statsBroadcaster ticks every 3 s to keep queued players' counters fresh.
func (h *Hub) statsBroadcaster() {
	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()
	for range ticker.C {
		h.mu.Lock()
		queueCopy := make([]*Player, len(h.queue))
		copy(queueCopy, h.queue)
		qLen := len(h.queue)
		h.mu.Unlock()
		h.sendStatsTo(queueCopy, qLen)
	}
}

// matchBestPair removes and returns the best pair from the queue.
// Same-difficulty players are preferred; falls back to the first two players.
// Must be called with h.mu held. Returns nil, nil if fewer than 2 players.
func (h *Hub) matchBestPair() (*Player, *Player) {
	if len(h.queue) < 2 {
		return nil, nil
	}
	i1, i2 := 0, 1 // default: first two
	for i := 0; i < len(h.queue)-1; i++ {
		for j := i + 1; j < len(h.queue); j++ {
			if h.queue[i].Difficulty == h.queue[j].Difficulty {
				i1, i2 = i, j
				goto found
			}
		}
	}
found:
	p1 := h.queue[i1]
	p2 := h.queue[i2]
	// Remove higher index first to keep lower index valid.
	h.queue = append(h.queue[:i2], h.queue[i2+1:]...)
	h.queue = append(h.queue[:i1], h.queue[i1+1:]...)
	return p1, p2
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
