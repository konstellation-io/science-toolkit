package codeserver

import (
	"fmt"
)

// UserData contains data about the user
type User struct {
	Username string
}

// GetSecretName return the name of the secret associated with the user
func (u User) GetSecretName() string {
	return fmt.Sprintf("codeserver-oauth2-secrets-%s", u.Username)
}

// GetSecretName return the name of the server associated with the user
func (u User) GetServerName() string {
	return fmt.Sprintf("codeserver-%s", u.Username)
}

// GetOAuthName return the oauth2 application name associated with the user
func (u User) GetOAuthName() string {
	return fmt.Sprintf("codeserver-app-%s", u.Username)
}
