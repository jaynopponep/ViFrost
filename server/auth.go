package main

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/MicahParks/keyfunc/v3"
	"github.com/golang-jwt/jwt/v5"
)

// authVerifier verifies Supabase access tokens against the project JWKS.
// Supabase asymmetric signing keys (ES256/P-256) are published at
// <SUPABASE_URL>/auth/v1/.well-known/jwks.json. keyfunc caches + refreshes
// them so signing-key rotation needs no redeploy.
type authVerifier struct {
	jwks keyfunc.Keyfunc
}

func newAuthVerifier(supabaseURL string) (*authVerifier, error) {
	jwksURL := supabaseURL + "/auth/v1/.well-known/jwks.json"
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	jwks, err := keyfunc.NewDefaultCtx(ctx, []string{jwksURL})
	if err != nil {
		return nil, fmt.Errorf("load jwks: %w", err)
	}
	return &authVerifier{jwks: jwks}, nil
}

// verify parses and validates the token, returning the Supabase user id
// (the `sub` claim == profiles.id).
func (v *authVerifier) verify(token string) (string, error) {
	parsed, err := jwt.Parse(token, v.jwks.Keyfunc,
		jwt.WithValidMethods([]string{"ES256"}))
	if err != nil {
		return "", fmt.Errorf("parse token: %w", err)
	}
	if !parsed.Valid {
		return "", errors.New("token invalid")
	}
	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("unexpected claims type")
	}
	return userIDFromClaims(claims)
}

// userIDFromClaims enforces aud == "authenticated" and a non-empty sub.
// split out so it is unit-testable without a signed token.
func userIDFromClaims(claims map[string]interface{}) (string, error) {
	aud, _ := claims["aud"].(string)
	if aud != "authenticated" {
		return "", fmt.Errorf("aud %q is not authenticated", aud)
	}
	sub, _ := claims["sub"].(string)
	if sub == "" {
		return "", errors.New("sub claim missing")
	}
	return sub, nil
}
