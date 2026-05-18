package main

import (
	"strconv"
	"sync"
	"sync/atomic"
)

// this file (Hub) handles matchmaking, handles active sessions and also waiting rooms
type Hub struct {
	waiting chan *Player
	rooms   map[string]*Room
	roomMu  sync.RWMutex
	nextID  atomic.Uint64
}

func NewHub() *Hub {
	h := &Hub{
		waiting: make(chan *Player, 2),  // waiting queue, threshold of 2 must be in here to initiate a game by running h.matchmaking() loop
		rooms:   make(map[string]*Room), // active rooms
	}
	go h.matchmaking()
	return h
}

func (h *Hub) matchmaking() {
	var queue []*Player
	for p := range h.waiting {
		p.mu.Lock()
		alive := p.active
		p.inQueue = false
		p.mu.Unlock()
		if !alive {
			continue
		}
		queue = append(queue, p)
		for len(queue) >= 2 {
			p1, p2 := queue[0], queue[1]
			// catching bug where user can play against self.
			// Ideally it is better to handle by unique user ID but im too lazy rn
			if p1.Username != "" && p1.Username == p2.Username {
				queue = queue[1:]
				continue
			}
			room := NewRoom(h, p1, p2)
			p1.mu.Lock()
			p1.Room = room
			p1.mu.Unlock()
			p2.mu.Lock()
			p2.Room = room
			p2.mu.Unlock()
			h.roomMu.Lock()
			h.rooms[room.ID] = room
			h.roomMu.Unlock()
			queue = queue[2:]
			go room.Start()
			break
		}
	}
}

func (h *Hub) Enqueue(p *Player) {
	p.mu.Lock()
	if p.inQueue {
		p.mu.Unlock()
		return
	}
	p.inQueue = true
	p.mu.Unlock()
	h.waiting <- p
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
