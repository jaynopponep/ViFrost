package main

import "testing"

func TestUserIDFromClaimsRequiresAuthenticatedAud(t *testing.T) {
	good := map[string]interface{}{"sub": "uuid-123", "aud": "authenticated"}
	id, err := userIDFromClaims(good)
	if err != nil || id != "uuid-123" {
		t.Fatalf("expected uuid-123,nil got %q,%v", id, err)
	}

	wrongAud := map[string]interface{}{"sub": "uuid-123", "aud": "anon"}
	if _, err := userIDFromClaims(wrongAud); err == nil {
		t.Error("expected error for non-authenticated aud")
	}

	noSub := map[string]interface{}{"aud": "authenticated"}
	if _, err := userIDFromClaims(noSub); err == nil {
		t.Error("expected error when sub missing")
	}
}
