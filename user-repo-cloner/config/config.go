package config

import (
	"log"
	"os"

	"github.com/kelseyhightower/envconfig"
	"gopkg.in/yaml.v3"
)

// Config holds the configuration values of the application.
type Config struct {
	UsrName               string `envconfig:"USER_NAME"`
	LogLevel              string `yaml:"logLevel" envconfig:"LOG_LEVEL"`
	RepoUrlGeneric        string `yaml:"repoUrlGeneric" envconfig:"REPO_URL_GENERIC"`
	PathGeneric           string `yaml:"pathGeneric" envconfig:"PATH_GENERIC"`
	CheckFrequencySeconds int    `yaml:"checkFrequencySeconds" envconfig:"CHECK_FREQUENCY_SECONDS"`
	MongoDB               struct {
		URI              string `yaml:"uri" envconfig:"URI"`
		DBName           string `yaml:"dbName" envconfig:"DB_NAME"`
		ProjectsCollName string `yaml:"projectCollName" envconfig:"PROJECT_COLL_NAME"`
		UsersCollName    string `yaml:"userCollName" envconfig:"USER_COLL_NAME"`
		RepoNameKey      string `yaml:"repoNameKey" envconfig:"REPO_NAME_KEY"`
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
