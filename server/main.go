package main

import (
	"encoding/json"
	"net/http"
	"os"
)

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next(w, r)
	}
}

func handleRun(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var body struct {
		Code  string `json:"code"`
		Tests string `json:"tests"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}
	results := RunTests(body.Code, body.Tests)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"results": results})
}

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
	http.HandleFunc("/run", corsMiddleware(handleRun))

	LogInfo("listening on %s", addr)
	if err := http.ListenAndServe(addr, nil); err != nil {
		LogErr("server: %v", err)
		os.Exit(1)
	}
}
