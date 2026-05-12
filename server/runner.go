package main

import (
	"context"
	"encoding/json"
	"os"
	"os/exec"
	"strings"
	"time"
)

const RunTimeout = 10 * time.Second

func RunTests(code, testsContent string) []bool {
	f, err := os.CreateTemp("", "vifrost-*.py")
	if err != nil {
		LogErr("RunTests: create temp: %v", err)
		return nil
	}
	defer os.Remove(f.Name())

	if _, err := f.WriteString(code + "\n" + testsContent); err != nil {
		f.Close()
		LogErr("RunTests: write: %v", err)
		return nil
	}
	f.Close()

	ctx, cancel := context.WithTimeout(context.Background(), RunTimeout)
	defer cancel()

	// Capture stdout only; stderr (syntax errors, tracebacks) is discarded
	out, _ := exec.CommandContext(ctx, "python3", f.Name()).Output()

	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	if len(lines) == 0 || lines[len(lines)-1] == "" {
		return nil
	}
	lastLine := lines[len(lines)-1]

	var results []bool
	if err := json.Unmarshal([]byte(lastLine), &results); err != nil {
		LogErr("RunTests: parse output %q: %v", lastLine, err)
		return nil
	}
	return results
}
