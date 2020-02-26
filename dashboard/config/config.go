package config

import (
	"os"
	"sync"

	"github.com/kelseyhightower/envconfig"
	"gopkg.in/yaml.v2"
)

var once sync.Once
var cfg *Config

// Config holds the configuration values for the application
type Config struct {
	BaseDomainName string `yaml:"baseDomainName" envconfig:"TOOLKIT_BASE_DOMAIN_NAME"`

	Server struct {
		Port string `yaml:"port" envconfig:"TOOLKIT_PORT"`
	} `yaml:"server"`

	Kubernetes struct {
		Namespace string `yaml:"namespace" envconfig:"POD_NAMESPACE"`

		IsInsideCluster bool
	} `yaml:"kubernetes"`
}

// NewConfig will read the config.yml file and override values with env vars.
func New() *Config {
	once.Do(func() {
		f, err := os.Open("config.yml")
		if err != nil {
			panic(err)
		}

		cfg = &Config{}
		decoder := yaml.NewDecoder(f)
		err = decoder.Decode(cfg)
		if err != nil {
			panic(err)
		}

		if os.Getenv("KUBERNETES_PORT") != "" {
			cfg.Kubernetes.IsInsideCluster = true
		}

		err = envconfig.Process("", cfg)
		if err != nil {
			panic(err)
		}
	})

	return cfg
}
