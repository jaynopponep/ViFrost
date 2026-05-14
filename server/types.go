package main

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// websocket msg types go by Envelopes. type is e.g. join_queue, ... see @constants.go
type Envelope struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload,omitempty"`
}

type GameStartPayload struct {
	RoomID        string `json:"roomId"`
	Snippet       string `json:"snippet"`
	Duration      int    `json:"duration"`
	OpponentName  string `json:"opponentName"`
	PlayerColor   string `json:"playerColor"`
	OpponentColor string `json:"opponentColor"`
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
	KeybindsUsed  []KeybindPayload `json:"keybindsUsed,omitempty"`
	Score         int              `json:"score"`
	OpponentScore int              `json:"opponentScore"`
	Won           bool             `json:"won"`
	Tied          bool             `json:"tied"`
	KeybindBonus  int              `json:"keybindBonus"`
}

type ErrorPayload struct {
	Message string `json:"message"`
}

type RunCodePayload struct {
	Code string `json:"code"`
}

type RunResultPayload struct {
	Results []bool `json:"results"`
	Delta   int    `json:"delta"`
}

type ScoreUpdateClientPayload struct {
	Delta        int `json:"delta"`
	KeybindDelta int `json:"keybindDelta"`
}

type ScoreUpdateServerPayload struct {
	MyScore       int `json:"myScore"`
	OpponentScore int `json:"opponentScore"`
}

type Player struct {
	ID       string
	Username string
	Conn     *websocket.Conn // <- TCP connection for each player's browser window open
	Send     chan []byte
	Room     *Room
	Keybinds     []KeybindPayload
	Score        int
	PassedTests  []bool
	Submitted    bool
	SubmitTime   time.Time
	KeybindCount int
	active      bool
	mu          sync.Mutex
}

type Room struct {
	ID           string
	Hub          *Hub
	Players      [2]*Player
	Colors       [2]string
	Snippet      string
	TestsContent string
	Timer        int
	done         chan struct{}
	ended        bool
	mu           sync.Mutex
}
