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

func LoadRandomSnippet(dir string) (string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return "", err
	}
	var files []string
	for _, e := range entries {
		if !e.IsDir() {
			files = append(files, e.Name())
		}
	}
	if len(files) == 0 {
		return "", nil
	}
	chosen := files[rand.Intn(len(files))]
	data, err := os.ReadFile(filepath.Join(dir, chosen))
	if err != nil {
		return "", err
	}
	return string(data), nil
}
