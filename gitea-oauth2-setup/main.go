package main

import (
	"log"
	"os"
)

func main() {
	cfg, err := NewConfig()
	if err != nil {
		log.Fatalf("creating config: %s", err)
	}

	k8s := NewK8s(cfg)

	// Check if the application already exists
	exists, err := k8s.IsSecretPresent(cfg.Credentials.SecretName)
	if err != nil {
		log.Fatalf("Error checking secret credentials: %s", err)
	}

	if exists {
		log.Printf("The \"%s\" oAuth2 application already exists in Gitea, nothing to do.\n", cfg.Gitea.AppName)
		os.Exit(0)
	}

	// Wait for Gitea ready
	err = waitForGitea(cfg)
	if err != nil {
		log.Fatalf("Error waiting for Gitea: %s\n", err)
	}

	// Create the oAuth2 application in Gitea
	credentials, err := createOauth2Application(cfg.Gitea.AppName, cfg.Gitea.RedirectUris, cfg.Gitea.URL, cfg.Gitea.Username, cfg.Gitea.Password)
	if err != nil {
		log.Fatalf("Error creating the application in Gitea: %s\n", err)
	}

	// Create the k8s secret storing the client credentials
	secretValues := map[string]string{
		"OAUTH2_CLIENT_ID":     credentials.ClientID,
		"OAUTH2_CLIENT_SECRET": credentials.ClientSecret,
	}
	err = k8s.CreateSecret(cfg.Credentials.SecretName, secretValues)
	if err != nil {
		log.Fatalf("Error creating \"%s\" k8s secret credentials: %s\n", cfg.Credentials.SecretName, err)
	}

	log.Printf("The oAuth2 application \"%s\" was created correctly.", cfg.Gitea.AppName)
}
