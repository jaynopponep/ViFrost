package main

import (
	"bytes"
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"strings"
	"time"
)

const RunTimeout = 10 * time.Second

// maximum error text returned to the client, so a runaway traceback can't
// bloat the run_result frame.
const maxRunErrLen = 4000

// RunTests runs the player's code plus the test harness and returns the
// per-test pass vector. the second return value is an error
// message (empty on success): the python stderr for a syntax/runtime error,
// or a timeout notice. additive: the caller only forwards this to the client,
// it does not affect scoring or win math.
func RunTests(code, testsContent string) ([]bool, string) {
	f, err := os.CreateTemp("", "vifrost-*.py")
	if err != nil {
		LogErr("RunTests: create temp: %v", err)
		return nil, "internal error: could not create temp file"
	}
	defer os.Remove(f.Name())

	if _, err := f.WriteString(code + "\n" + testsContent); err != nil {
		f.Close()
		LogErr("RunTests: write: %v", err)
		return nil, "internal error: could not write temp file"
	}
	f.Close()

	ctx, cancel := context.WithTimeout(context.Background(), RunTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, "python3", f.Name())
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	runErr := cmd.Run()

	if ctx.Err() == context.DeadlineExceeded {
		return nil, "execution timed out after 10s (possible infinite loop)"
	}

	lines := strings.Split(strings.TrimSpace(stdout.String()), "\n")
	lastLine := lines[len(lines)-1]

	var results []bool
	if lastLine != "" && json.Unmarshal([]byte(lastLine), &results) == nil {
		return results, ""
	}

	// no parseable results: surface why (syntax error / runtime traceback)
	// temp path is replaced so it reads as their own code; output is capped.
	msg := strings.TrimSpace(stderr.String())
	if msg == "" && runErr != nil {
		msg = runErr.Error()
	}
	if msg == "" {
		msg = "your code produced no test output"
	}
	msg = strings.ReplaceAll(msg, f.Name(), "<your code>")
	if len(msg) > maxRunErrLen {
		msg = msg[:maxRunErrLen] + "\n… (truncated)"
	}
	return nil, msg
}
