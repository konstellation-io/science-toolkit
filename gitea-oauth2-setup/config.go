package main

import (
	"fmt"
	"os"
	"strings"
	"sync"

	"github.com/kelseyhightower/envconfig"
)

var once sync.Once
var cfg *Config

// Config holds the configuration values for the application
type Config struct {
	Gitea struct {
		URL          string `envconfig:"GITEA_URL" required:"true"`
		Username     string `envconfig:"GITEA_ADMIN_USER" required:"true"`
		Password     string `envconfig:"GITEA_ADMIN_PASSWORD" required:"true"`
		Name         string `envconfig:"GITEA_APPLICATION_NAME" required:"true"`
		RedirectUris []string
	}
	Credentials struct {
		SecretName string `envconfig:"DEPLOYMENT_SECRET_NAME" required:"true"`
		Prefix     string `envconfig:"OAUTH2_CREDENTIALS_PREFIX" required:"true"`
	}
	Timeout    int `envconfig:"GITEA_INIT_TIMEOUT" default:"200"`
	Kubernetes struct {
		IsInsideCluster bool
		Namespace       string `envconfig:"POD_NAMESPACE" required:"true"`
	} `yaml:"kubernetes"`
}

// NewConfig will read the config.yml file and override values with env vars.
func NewConfig() (*Config, error) {

	cfg = &Config{}

	if os.Getenv("KUBERNETES_PORT") != "" {
		cfg.Kubernetes.IsInsideCluster = true
	}
	cfg.Gitea.RedirectUris = strings.Split(os.Getenv("GITEA_REDIRECT_URIS"), ",")
	if len(cfg.Gitea.RedirectUris) == 0 && os.Getenv("GITEA_REDIRECT_URIS") == "" {
		return nil, fmt.Errorf("missing value for environment variable GITEA_REDIRECT_URIS")

	}

	err := envconfig.Process("", cfg)
	if err != nil {
		return nil, fmt.Errorf("error parsing environment config: %w", err)
	}

	return cfg, nil
}
