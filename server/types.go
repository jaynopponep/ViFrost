package main

import (
	"sync"

	"github.com/gorilla/websocket"
)

// websocket msg types go by Envelopes. type is e.g. join_queue, ... see @constants.go
type Envelope struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload,omitempty"`
}

type GameStartPayload struct {
	RoomID   string `json:"roomId"`
	Snippet  string `json:"snippet"`
	Duration int    `json:"duration"`
}

type KeybindPayload struct {
	Keys    string `json:"keys"`
	Complex bool   `json:"complex"`
	Penalty bool   `json:"penalty"`
}

type TimerTickPayload struct {
	Remaining int `json:"remaining"`
}

type GameEndPayload struct {
	KeybindsUsed []KeybindPayload `json:"keybindsUsed,omitempty"`
	Score        int              `json:"score,omitempty"`
}

type ErrorPayload struct {
	Message string `json:"message"`
}

type Player struct {
	ID       string
	Conn     *websocket.Conn // <- TCP connection for each player's browser window open
	Send     chan []byte
	Room     *Room
	Keybinds []KeybindPayload
	Score    int
	mu       sync.Mutex
}

type Room struct {
	ID      string
	Hub     *Hub
	Players [2]*Player
	Snippet string
	Timer   int
	done    chan struct{}
	ended   bool
	mu      sync.Mutex
}
