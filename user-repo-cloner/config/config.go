package config

import (
	"log"
	"os"

	"github.com/kelseyhightower/envconfig"
	"gopkg.in/yaml.v3"
)

// Config holds the configuration values of the application.
type Config struct {
	UsrName               string `yaml:"usrName"`
	LogLevel              string `yaml:"logLevel"`
	RepoUrlGeneric        string `yaml:"repoUrlGeneric"`
	PathGeneric           string `yaml:"pathGeneric"`
	CheckFrequencySeconds int    `yaml:"checkFrequencySeconds"`
	MongoDB               struct {
		URI              string `yaml:"uri"`
		DBName           string `yaml:"dbName"`
		ProjectsCollName string `yaml:"projectCollName"`
		UsersCollName    string `yaml:"userCollName"`
		RepoNameKey      string `yaml:"repoNameKey"`
	}
}

// NewConfig will read the config.yml file and override values with env vars.
func NewConfig() Config {
	f, err := os.Open("config.yml")
	if err != nil {
		log.Fatalf("Error opening config.yml: %s", err)
	}

	cfg := Config{}
	decoder := yaml.NewDecoder(f)

	err = decoder.Decode(&cfg)
	if err != nil {
		log.Fatalf("Error loading config.yml: %s", err)
	}

	err = envconfig.Process("", &cfg)
	if err != nil {
		panic(err)
	}

	return cfg
}
