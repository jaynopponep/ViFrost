# ViFrost Server
## First:
Make sure you have Go downloaded... \
https://go.dev/doc/install \
(Latest version is v1.26.1)

## Running Locally
```bash
cd ViFrost/server

# Install dependencies
go mod download

# Run
go run .
```

## Build & Run Binary

```bash
go build -o server .
./server
```

## WebSocket Endpoint
```
ws://localhost:8080/ws
```


## Message Types
(Had Claude generate this:)
| Type | Description |
|------|-------------|
| `join_queue` | Join matchmaking queue |
| `match_found` | Notified when a match is found |
| `game_start` | Game begins |
| `keybind` | Player keystroke event |
| `timer_tick` | Server clock tick (every 1s, 120s total) |
| `game_end` | Game over |
| `leave` | Player leaves |
| `ping` / `pong` | Heartbeat |
