package main

import (
	"bufio"
	"os"
	"strings"
)

// loadDotEnv reads server/.env into the process environment if present.
// existing real env vars win (we never overwrite an already-set var).
// minimal on purpose: no quotes/expansion handling needed for our keys.
func loadDotEnv(path string) {
	f, err := os.Open(path)
	if err != nil {
		LogInfo("no .env at %s (using process env): %v", path, err)
		return
	}
	defer f.Close()
	sc := bufio.NewScanner(f)
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		k, v, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}
		k = strings.TrimSpace(k)
		v = strings.Trim(strings.TrimSpace(v), `"'`)
		if _, exists := os.LookupEnv(k); !exists {
			_ = os.Setenv(k, v)
		}
	}
}

// supabaseConfig holds the values the server needs to verify tokens and
// settle matches. mustSupabaseConfig fails fast with a clear message.
type supabaseConfig struct {
	URL            string
	ServiceRoleKey string
}

func mustSupabaseConfig() supabaseConfig {
	c := supabaseConfig{
		URL:            strings.TrimRight(strings.TrimSpace(os.Getenv("SUPABASE_URL")), "/"),
		ServiceRoleKey: strings.TrimSpace(os.Getenv("SUPABASE_SERVICE_ROLE_KEY")),
	}
	if c.URL == "" {
		LogErr("SUPABASE_URL is not set (server/.env)")
		os.Exit(1)
	}
	if c.ServiceRoleKey == "" {
		LogErr("SUPABASE_SERVICE_ROLE_KEY is not set (server/.env)")
		os.Exit(1)
	}
	return c
}
