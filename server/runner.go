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

// buildHarness wraps each assert line so that actual and expected values are
// captured independently, then prints a JSON array of TestResult objects as
// the last line of stdout.
func buildHarness(code, testsContent string) string {
	var sb strings.Builder
	sb.WriteString(code)
	sb.WriteString("\n\nimport json as _json\n_results = []\n")

	for _, rawLine := range strings.Split(testsContent, "\n") {
		trimmed := strings.TrimSpace(rawLine)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}
		if strings.HasPrefix(trimmed, "assert ") {
			expr := strings.TrimPrefix(trimmed, "assert ")
			expr = stripAssertMsg(expr)
			parts := strings.SplitN(expr, " == ", 2)
			if len(parts) == 2 {
				lhs := strings.TrimSpace(parts[0])
				rhs := strings.TrimSpace(parts[1])
				sb.WriteString("try:\n")
				sb.WriteString("    _lhs = " + lhs + "\n")
				sb.WriteString("    _rhs = " + rhs + "\n")
				sb.WriteString("    _passed = _lhs == _rhs\n")
				sb.WriteString(`    _results.append({"passed": _passed, "actual": repr(_lhs), "expected": repr(_rhs)})` + "\n")
				sb.WriteString("except Exception as _e:\n")
				sb.WriteString(`    _results.append({"passed": False, "actual": "error: " + str(_e), "expected": ""})` + "\n")
			} else {
				// No == found — fall back to simple pass/fail
				sb.WriteString("try:\n    ")
				sb.WriteString(trimmed)
				sb.WriteString("\n")
				sb.WriteString(`    _results.append({"passed": True, "actual": "", "expected": ""})` + "\n")
				sb.WriteString("except Exception:\n")
				sb.WriteString(`    _results.append({"passed": False, "actual": "assertion failed", "expected": ""})` + "\n")
			}
		} else {
			// Setup / mutation line — run at module scope so state persists across tests.
			sb.WriteString(trimmed + "\n")
		}
	}

	sb.WriteString("print(_json.dumps(_results))\n")
	return sb.String()
}

// stripAssertMsg removes the optional trailing message argument from a Python
// assert expression, e.g. "func(a) == b, f\"msg\"" → "func(a) == b".
// It tracks bracket depth and string mode to correctly identify the message
// separator comma.
func stripAssertMsg(expr string) string {
	depth := 0
	inStr := false
	strChar := byte(0)
	lastComma := -1

	for i := 0; i < len(expr); i++ {
		c := expr[i]
		if inStr {
			if c == '\\' {
				i++ // skip escaped character
			} else if c == strChar {
				inStr = false
			}
			continue
		}
		switch c {
		case '"', '\'':
			inStr = true
			strChar = c
		case '(', '[', '{':
			depth++
		case ')', ']', '}':
			depth--
		case ',':
			if depth == 0 {
				lastComma = i
			}
		}
	}

	if lastComma < 0 {
		return expr
	}
	rest := strings.TrimSpace(expr[lastComma+1:])
	if isStringPrefix(rest) {
		return strings.TrimSpace(expr[:lastComma])
	}
	return expr
}

func isStringPrefix(s string) bool {
	for _, p := range []string{`f"`, `f'`, `r"`, `r'`, `b"`, `b'`, `"`, `'`} {
		if strings.HasPrefix(s, p) {
			return true
		}
	}
	return false
}

// runPython tries python3 first (Linux/Mac), then python (Windows).
func runPython(ctx context.Context, filename string) []byte {
	for _, exe := range []string{"python3", "python"} {
		var stdout, stderr bytes.Buffer
		cmd := exec.CommandContext(ctx, exe, filename)
		cmd.Stdout = &stdout
		cmd.Stderr = &stderr
		err := cmd.Run()
		if err != nil {
			if isNotFound(err) {
				continue
			}
			return stdout.Bytes()
		}
		return stdout.Bytes()
	}
	return nil
}

func isNotFound(err error) bool {
	if err == nil {
		return false
	}
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "not found") ||
		strings.Contains(msg, "no such file") ||
		strings.Contains(msg, "executable file not found") ||
		strings.Contains(msg, "the system cannot find")
}

func RunTests(code, testsContent string) []TestResult {
	f, err := os.CreateTemp("", "vifrost-*.py")
	if err != nil {
		LogErr("RunTests: create temp: %v", err)
		return nil
	}
	defer os.Remove(f.Name())

	harness := buildHarness(code, testsContent)
	if _, err := f.WriteString(harness); err != nil {
		f.Close()
		LogErr("RunTests: write: %v", err)
		return nil
	}
	f.Close()

	ctx, cancel := context.WithTimeout(context.Background(), RunTimeout)
	defer cancel()

	out := runPython(ctx, f.Name())

	lines := strings.Split(strings.TrimSpace(string(out)), "\n")
	if len(lines) == 0 {
		return nil
	}
	lastLine := lines[len(lines)-1]
	if lastLine == "" {
		return nil
	}

	var results []TestResult
	if err := json.Unmarshal([]byte(lastLine), &results); err != nil {
		LogErr("RunTests: parse output %q: %v", lastLine, err)
		return nil
	}
	return results
}
