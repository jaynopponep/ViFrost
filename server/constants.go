package main

const (
	DefaultPort = "8080"
	ReadBuffer  = 1024
	WriteBuffer = 1024
)

const (
	MsgJoinQueue   = "join_queue"
	MsgMatchFound  = "match_found"
	MsgGameStart   = "game_start"
	MsgKeybind     = "keybind"
	MsgTimerTick   = "timer_tick"
	MsgGameEnd     = "game_end"
	MsgLeave       = "leave"
	MsgError       = "error"
	MsgPing        = "ping"
	MsgPong        = "pong"
)

const (
	GameDurationSec = 120
	TickIntervalSec = 1
)

const DefaultSnippet = "func main() {\n\tfmt.Println(\"hello\")\n}"
