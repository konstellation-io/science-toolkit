package usertools

import (
	"fmt"
)

// UserData contains data about the user
type User struct {
	Username string
}

// GetSecretName return the name of the secret associated with the user
func (u User) GetSecretName(toolName string) string {
	return fmt.Sprintf("%s-oauth2-secrets-%s", toolName, u.Username)
}

// GetSecretName return the name of the server associated with the user
func (u User) GetServerName() string {
	return fmt.Sprintf("usertools-%s", u.Username)
}

// GetOAuthName return the oauth2 application name associated with the user
func (u User) GetOAuthName(toolName string) string {
	return fmt.Sprintf("%s-app-%s", toolName, u.Username)
}
