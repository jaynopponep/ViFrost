package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"time"
)

// buildSettlePayload maps final room state to the record_match_result args.
// p_winner is the winning player's Supabase user id, or nil on a tie.
func buildSettlePayload(r *Room, scores [2]int) map[string]interface{} {
	p1, p2 := r.Players[0], r.Players[1]
	var winner interface{} // nil => tie
	switch {
	case scores[0] > scores[1]:
		winner = p1.UserID
	case scores[1] > scores[0]:
		winner = p2.UserID
	}
	return map[string]interface{}{
		"p_room_id":       r.ID,
		"p_mode":          r.Mode,
		"p_player1":       p1.UserID,
		"p_player2":       p2.UserID,
		"p_player1_score": scores[0],
		"p_player2_score": scores[1],
		"p_winner":        winner,
		"p_challenge":     r.Challenge,
		"p_duration":      GameDurationSec,
	}
}

// settleMatch POSTs the result to the Supabase RPC using the service-role
// key. failure is logged and swallowed: the match already completed for the
// players; a lost settle is a known demo limitation, never a crash.
func settleMatch(cfg supabaseConfig, r *Room, scores [2]int) {
	p1, p2 := r.Players[0], r.Players[1]
	if p1 == nil || p2 == nil || p1.UserID == "" || p2.UserID == "" {
		LogErr("settle skipped room %s: missing player identity", r.ID)
		return
	}
	body, err := json.Marshal(buildSettlePayload(r, scores))
	if err != nil {
		LogErr("settle marshal room %s: %v", r.ID, err)
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	url := cfg.URL + "/rest/v1/rpc/record_match_result"
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		LogErr("settle request room %s: %v", r.ID, err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", cfg.ServiceRoleKey)
	req.Header.Set("Authorization", "Bearer "+cfg.ServiceRoleKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		LogErr("settle post room %s: %v", r.ID, err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		LogErr("settle room %s: supabase status %d", r.ID, resp.StatusCode)
		return
	}
	LogInfo("settled match room %s (mode=%s)", r.ID, r.Mode)
}
