package config

import (
	"log"
	"os"

	"github.com/kelseyhightower/envconfig"
	"gopkg.in/yaml.v3"
)

// Config holds the configuration values of the application.
type Config struct {
	UsrName               string `envconfig:"KDL_USER_NAME"`
	LogLevel              string `yaml:"logLevel" envconfig:"LOG_LEVEL"`
	ReposPath             string `yaml:"reposPath" envconfig:"REPOS_PATH"`
	InternalRepoBaseURL   string `yaml:"internalRepoBaseURL" envconfig:"INTERNAL_REPO_BASE_URL"`
	PemFile               string `yaml:"pemFile" envconfig:"PEM_FILE"`
	PemFilePassword       string `yaml:"pemFilePassword" envconfig:"PEM_FILE_PASSWORD"`
	CheckFrequencySeconds int    `yaml:"checkFrequencySeconds" envconfig:"CHECK_FREQUENCY_SECONDS"`
	MongoDB               struct {
		URI              string `yaml:"uri" envconfig:"KDL_SERVER_MONGODB_URI"`
		DBName           string `yaml:"dbName" envconfig:"DB_NAME"`
		ProjectsCollName string `yaml:"projectCollName" envconfig:"PROJECT_COLL_NAME"`
		UsersCollName    string `yaml:"userCollName" envconfig:"USER_COLL_NAME"`
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
