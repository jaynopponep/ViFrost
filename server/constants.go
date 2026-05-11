package main

const (
	DefaultPort = "8080"
	ReadBuffer  = 1024
	WriteBuffer = 1024
)

const (
	MsgJoinQueue    = "join_queue"
	MsgMatchFound   = "match_found"
	MsgPlayerReady  = "player_ready"
	MsgGameStart    = "game_start"
	MsgKeybind      = "keybind"
	MsgTimerTick    = "timer_tick"
	MsgGameEnd      = "game_end"
	MsgLeave        = "leave"
	MsgError        = "error"
	MsgScoreUpdate  = "score_update"
	MsgPing         = "ping"
	MsgPong         = "pong"
	MsgRunCode      = "run_code"
	MsgRunResult    = "run_result"
	MsgOpponentLeft = "opponent_left"
	MsgQueueStats   = "queue_stats"
)

const (
	GameDurationSec = 120
	TickIntervalSec = 1
)

const SnippetsDir = "code_snippets"
