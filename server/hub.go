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
		waiting: make(chan *Player, 2), // waiting queue, threshold of 2 must be in here to initiate a game by running h.matchmaking() loop
		rooms:   make(map[string]*Room), // active rooms
	}
	go h.matchmaking()
	return h
}

func (h *Hub) matchmaking() {
	var queue []*Player
	for p := range h.waiting {
		queue = append(queue, p)
		if len(queue) >= 2 {
			room := NewRoom(h, queue[0], queue[1])
			queue[0].Room = room
			queue[1].Room = room
			h.roomMu.Lock()
			h.rooms[room.ID] = room
			h.roomMu.Unlock()
			queue = queue[:0]
			room.Start()
		}
	}
}

func (h *Hub) Enqueue(p *Player) {
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
