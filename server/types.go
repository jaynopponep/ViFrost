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
	KeybindsUsed       []KeybindPayload `json:"keybindsUsed,omitempty"`
	Score              int              `json:"score"`
	OpponentScore      int              `json:"opponentScore"`
	Won                bool             `json:"won"`
	Tied               bool             `json:"tied"`
	KeybindBonus       int              `json:"keybindBonus"`
	CompletionBonus    int              `json:"completionBonus"`
	FinishBonus        int              `json:"finishBonus"`
	OppKeybindBonus    int              `json:"oppKeybindBonus"`
	OppCompletionBonus int              `json:"oppCompletionBonus"`
	OppFinishBonus     int              `json:"oppFinishBonus"`
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
	// reason a run produced no results (syntax error,
	// runtime traceback, or timeout). empty on a normal run. forwarded to the
	// client for display only; does not affect scoring or win math.
	Error string `json:"error,omitempty"`
}

type OpponentRunResultPayload struct {
	Results []bool `json:"results"`
}

type MatchCountdownPayload struct {
	Seconds int `json:"seconds"`
}

type ScoreUpdateServerPayload struct {
	MyScore       int `json:"myScore"`
	OpponentScore int `json:"opponentScore"`
}

type Player struct {
	ID           string
	Username     string
	Conn         *websocket.Conn // <- TCP connection for each player's browser window open
	Send         chan []byte
	Room         *Room
	Keybinds     []KeybindPayload
	Score        int
	PassedTests  []bool
	Submitted    bool
	Ready        bool
	SubmitTime   time.Time
	KeybindCount int
	// server-authoritative keybind scoring state, all guarded by mu.
	// macroUseCount is the player's lifetime macro run count, it drives the
	// escalating macro reward. kbWindowStart/kbWindowCount are the per-player
	// keybind_event rate-limit window.
	macroUseCount int
	kbWindowStart time.Time
	kbWindowCount int
	active        bool
	inQueue       bool
	mu            sync.Mutex
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
	readyCh      chan struct{}
	live         bool
	ended        bool
	mu           sync.Mutex
}
