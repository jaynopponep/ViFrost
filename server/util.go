package main

import (
	"encoding/json"
	"log"
	"math/rand"
	"os"
	"path/filepath"
)

var logger = log.New(os.Stdout, "[vifrost] ", log.LstdFlags)

func EnvelopeFromType(msgType string, payload interface{}) Envelope {
	return Envelope{Type: msgType, Payload: payload}
}

// encodes msgs sent through WebSocket. packaged as bytes
func MustMarshal(v interface{}) []byte {
	b, err := json.Marshal(v)
	if err != nil {
		panic(err)
	}
	return b
}

// decoded msgs, previously packaged as bytes, now into Go values
func UnmarshalEnvelope(raw []byte) (Envelope, error) {
	var e Envelope
	err := json.Unmarshal(raw, &e)
	return e, err
}

func LogInfo(format string, args ...interface{}) {
	logger.Printf("[INFO] "+format, args...)
}

func LogErr(format string, args ...interface{}) {
	logger.Printf("[ERR] "+format, args...)
}

// loadFromDir picks a random problem subdirectory and loads its snippet, tests, and description.
// Expected layout: dir/{problem}/{problem}.txt + .tests.py + optional .desc.txt
func loadFromDir(dir string) (name, snippet, tests, description string, err error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return "", "", "", "", err
	}
	var problems []string
	for _, e := range entries {
		if e.IsDir() {
			problems = append(problems, e.Name())
		}
	}
	if len(problems) == 0 {
		return "", "", "", "", os.ErrNotExist
	}
	chosen := problems[rand.Intn(len(problems))]
	problemDir := filepath.Join(dir, chosen)

	snippetPath := filepath.Join(problemDir, chosen+".txt")
	data, err := os.ReadFile(snippetPath)
	if err != nil {
		return "", "", "", "", err
	}
	snippet = string(data)

	if testData, testErr := os.ReadFile(filepath.Join(problemDir, chosen+".tests.py")); testErr == nil {
		tests = string(testData)
	}
	if descData, descErr := os.ReadFile(filepath.Join(problemDir, chosen+".desc.txt")); descErr == nil {
		description = string(descData)
	}
	return chosen, snippet, tests, description, nil
}

// LoadSnippetWithTests tries to load from the difficulty-specific subdirectory first,
// then falls back to the root snippets directory.
func LoadSnippetWithTests(dir string, difficulty string) (name, snippet, tests, description string, err error) {
	if difficulty != "" {
		diffDir := filepath.Join(dir, difficulty)
		if n, sn, t, d, e := loadFromDir(diffDir); e == nil {
			return n, sn, t, d, nil
		}
	}
	return loadFromDir(dir)
}
