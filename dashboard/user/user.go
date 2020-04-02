package user

import (
	"fmt"

	"github.com/gosimple/slug"
)

// UserData contains data about the user
type User struct {
	Username string
}

// GetUsernameSlug return the url friendly name associated with the user
func (u User) GetUsernameSlug() string {
	return slug.Make(u.Username)
}

// GetSecretName return the name of the secret associated with the user
func (u User) GetSecretName(toolName string) string {
	return fmt.Sprintf("%s-oauth2-secrets-%s", toolName, u.GetUsernameSlug())
}

// GetResourceName return the name of the server associated with the user
func (u User) GetResourceName() string {
	return fmt.Sprintf("usertools-%s", u.GetUsernameSlug())
}

// GetOAuthName return the oauth2 application name associated with the user
func (u User) GetOAuthName(toolName string) string {
	return fmt.Sprintf("%s-app-%s", toolName, u.GetUsernameSlug())
}
