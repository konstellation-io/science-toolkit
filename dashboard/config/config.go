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

	VSCode struct {
		Ingress struct {
			Type string `yaml:"type" envconfig:"TOOLKIT_INGRESS_TYPE"`
		} `yaml:"ingress"`
		Storage struct {
			Size      string `yaml:"size" envconfig:"TOOLKIT_VSCODE_STORAGE_SIZE"`
			ClassName string `yaml:"className" envconfig:"TOOLKIT_VSCODE_STORAGE_CLASSNAME"`
		} `yaml:"storage"`
		SharedVolume struct {
			Name string `yaml:"name" envconfig:"TOOLKIT_SHARED_VOLUME"`
		} `yaml:"sharedVolume"`
	} `yaml:"vscode"`

	Kubernetes struct {
		Namespace string `yaml:"namespace" envconfig:"POD_NAMESPACE"`

		IsInsideCluster bool
	} `yaml:"kubernetes"`

	TLS bool `yaml:"tls" envconfig:"TOOLKIT_TLS"`
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
