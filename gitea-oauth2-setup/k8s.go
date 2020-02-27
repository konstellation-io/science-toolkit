package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// K8s manager for Kuberentes interaction
type K8s struct {
	cfg    *Config
	client *kubernetes.Clientset
}

// NewK8s initialize K8s manager
func NewK8s(cfg *Config) K8s {
	client := newClientset(cfg)
	return K8s{cfg, client}
}

// NewClientset return a Kuberentes client
func newClientset(cfg *Config) *kubernetes.Clientset {
	kubeConfig := newKubernetesConfig(cfg)

	// create the clientset
	clientset, err := kubernetes.NewForConfig(kubeConfig)
	if err != nil {
		log.Fatalf("Fatal error kubernetes config: %s", err)
	}

	return clientset
}

func newKubernetesConfig(config *Config) *rest.Config {
	if config.Kubernetes.IsInsideCluster == true {
		log.Printf("Creating K8s config in-cluster")

		kubeConfig, err := rest.InClusterConfig()
		if err != nil {
			log.Fatalf("fatal error kubernetes config: %s", err)
		}

		return kubeConfig
	}

	log.Printf("Creating K8s config from local .kube/config")

	// NOTE: It works only with the default user's config, not even the exported KUBECONFIG value
	kubeConfigPath := filepath.Join(os.Getenv("HOME"), ".kube", "config")

	// use the current context in kubeConfigPath
	kubeConfig, err := clientcmd.BuildConfigFromFlags("", kubeConfigPath)
	if err != nil {
		log.Fatalf("fatal error kubernetes config: %s", err)
	}

	return kubeConfig
}

// VerifySecretsCredentials verify that the given secrets containt already OAuth2 credentials
func (k K8s) VerifySecretsCredentials() (bool, error) {
	secret, err := k.client.CoreV1().Secrets(k.cfg.Kubernetes.Namespace).Get(k.cfg.Credentials.SecretName, metav1.GetOptions{})
	if err != nil {
		return false, err
	}
	key := fmt.Sprintf("%s_OAUTH2_INITIALIZED", strings.ToUpper(k.cfg.Credentials.Prefix))
	val, ok := secret.Data[key]
	if !ok {
		return false, fmt.Errorf("missing mandatory secret %s", key)
	}
	initialized := string(val) == "yes"
	log.Printf("Secrets OAuth2 credentials initialized: %s\n", val)
	return initialized, err
}

// UpdateSecretCredentials set ClientID and ClientSecret in Kubernetes secret object
func (k K8s) UpdateSecretCredentials(c *Credentials) error {
	secret, err := k.client.CoreV1().Secrets(k.cfg.Kubernetes.Namespace).Get(k.cfg.Credentials.SecretName, metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("error getting Kuberentes secrets: %w", err)
	}
	prefix := strings.ToUpper(k.cfg.Credentials.Prefix)
	clientIDKey := fmt.Sprintf("%s_OAUTH2_CLIENT_ID", prefix)
	clientSecretKey := fmt.Sprintf("%s_OAUTH2_CLIENT_SECRET", prefix)
	initializedKey := fmt.Sprintf("%s_OAUTH2_INITIALIZED", prefix)

	secret.Data[clientIDKey] = []byte(c.ClientID)
	secret.Data[clientSecretKey] = []byte(c.ClientSecret)
	secret.Data[initializedKey] = []byte("yes")
	_, err = k.client.CoreV1().Secrets(k.cfg.Kubernetes.Namespace).Update(secret)

	return err
}
