package codeserver

import (
	"fmt"

	"k8s.io/apimachinery/pkg/api/errors"

	"toolkit/dashboard/config"
	"toolkit/dashboard/kubernetes"
)

// CodeServer contains methods to manage CodeServer resources
type CodeServer struct {
	config    *config.Config
	resources *kubernetes.ResourceManager
}

// Status contains info about the status of the server
type ServerStatus struct {
	Running bool `json:"running"`
	SetupOK bool `json:"setupOk"`
}

// New creates a new CodeServer manager
func New(config *config.Config, resources *kubernetes.ResourceManager) *CodeServer {
	return &CodeServer{
		config,
		resources,
	}
}

// GetStatus returns the setup and running status of CodeServer for the given user
func (m *CodeServer) GetStatus(u User) (*ServerStatus, error) {
	status := &ServerStatus{
		SetupOK: false,
		Running: false,
	}
	secretPresent, err := m.resources.IsSecretPresent(u.GetSecretName())
	if err != nil {
		return status, nil
	}
	if !secretPresent {
		return status, nil
	}
	status.SetupOK = true

	running, err := m.resources.IsCodeServerRunning(u.GetServerName())
	if err != nil {
		return nil, err
	}

	status.Running = running

	return status, nil
}

// Start initialize a new CodeServer for the given user
func (m *CodeServer) Start(u User) error {
	secretPresent, err := m.resources.IsSecretPresent(u.GetSecretName())
	if err != nil && !errors.IsNotFound(err) {
		return err
	}

	if !secretPresent {
		err = m.createSecrets(u)
		if err != nil {
			return err
		}
	}

	err = m.resources.CreateCodeServer(u.GetServerName(), u.Username)
	if err != nil {
		return err
	}
	doneCh, err := m.resources.WaitCodeServerRunning(u.GetServerName(), 10)
	if err != nil {
		return err
	}
	running := <-doneCh
	if !running {
		return fmt.Errorf("CodeServer not running after %d seconds", 10)
	}
	return nil
}

// Stop stops a CodeServer associated with the given user
func (m *CodeServer) Stop(u User) error {
	status, err := m.GetStatus(u)
	if err != nil {
		return err
	}
	if !status.SetupOK || !status.Running {
		return fmt.Errorf("can't stop uninitialized CodeServer for user %s", u.Username)
	}

	return m.resources.DeleteCodeServer(u.GetServerName())
}

// createSecrets set ClientID and ClientSecret in Kubernetes secret object
func (m *CodeServer) createSecrets(u User) error {
	fmt.Println("creating secret")

	callbackURL := fmt.Sprintf("http://%s-code.%s/oauth2/callback", u.Username, m.config.BaseDomainName)
	data := map[string]string{}
	data["DEPLOYMENT_SECRET_NAME"] = u.GetSecretName()
	data["OAUTH2_CREDENTIALS_PREFIX"] = "CODESERVER"
	data["GITEA_REDIRECT_URIS"] = callbackURL
	data["GITEA_APPLICATION_NAME"] = u.GetOAuthName()
	data["CODESERVER_OAUTH2_CALLBACK_URL"] = callbackURL
	data["CODESERVER_OAUTH2_INITIALIZED"] = "no"

	return m.resources.CreateSecret(u.GetSecretName(), data)

}
