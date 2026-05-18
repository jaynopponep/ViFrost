package main

const (
	DefaultPort = "8080"
	ReadBuffer  = 1024
	WriteBuffer = 1024
)

const (
	MsgJoinQueue         = "join_queue"
	MsgMatchFound        = "match_found"
	MsgGameStart         = "game_start"
	MsgKeybind           = "keybind"
	MsgTimerTick         = "timer_tick"
	MsgGameEnd           = "game_end"
	MsgLeave             = "leave"
	MsgError             = "error"
	MsgScoreUpdate       = "score_update"
	MsgKeybindEvent      = "keybind_event"
	MsgPing              = "ping"
	MsgPong              = "pong"
	MsgRunCode           = "run_code"
	MsgRunResult         = "run_result"
	MsgSubmit            = "submit"
	MsgPlayerReady       = "player_ready"
	MsgOpponentReady     = "opponent_ready"
	MsgMatchCountdown    = "match_countdown"
	MsgMatchStart        = "match_start"
	MsgOpponentRunResult = "opponent_run_result"
)

const (
	GameDurationSec = 120
	TickIntervalSec = 1
	SubmitTimerSec  = 12
)

const SnippetsDir = "code_snippets"
