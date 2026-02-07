package main

import (
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = DefaultPort
	}
	addr := ":" + port

	hub := NewHub()
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ServeWs(hub, w, r)
	})

	LogInfo("listening on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		LogErr("server: %v", err)
		os.Exit(1)
	}
}
