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
	RoomID        string `json:"roomId"`
	Snippet       string `json:"snippet"`
	Description   string `json:"description"`
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
	IsWinner      bool             `json:"isWinner"`
	Reason        string           `json:"reason"` // "timeout" | "completion" | "opponent_left"
}

type ErrorPayload struct {
	Message string `json:"message"`
}

type RunCodePayload struct {
	Code string `json:"code"`
}

type TestResult struct {
	Passed   bool   `json:"passed"`
	Actual   string `json:"actual"`
	Expected string `json:"expected"`
}

type RunResultPayload struct {
	Tests []TestResult `json:"tests"`
	Delta int          `json:"delta"`
}

type QueueStatsPayload struct {
	PlayersOnline int `json:"playersOnline"`
	InQueue       int `json:"inQueue"`
}

type ScoreUpdateClientPayload struct {
	Delta int `json:"delta"`
}

type ScoreUpdateServerPayload struct {
	MyScore       int `json:"myScore"`
	OpponentScore int `json:"opponentScore"`
}

type Player struct {
	ID         string
	Username   string
	Difficulty string
	Conn       *websocket.Conn
	Send       chan []byte
	Room       *Room
	Keybinds   []KeybindPayload
	Score      int
	PassedTests []bool
	active      bool
	mu          sync.Mutex
}

type Room struct {
	ID           string
	Hub          *Hub
	Players      [2]*Player
	Colors       [2]string
	Snippet      string
	Description  string
	TestsContent string
	Timer        int
	done         chan struct{}
	readyCh      chan struct{}
	ended        bool
	winner       *Player
	endReason    string
	mu           sync.Mutex
}
