package usertools

import (
	"context"
	"fmt"

	"toolkit/dashboard/config"
	"toolkit/dashboard/kubernetes"
	"toolkit/dashboard/user"
)

// UserTools contains methods to manage UserTools resources
type UserTools struct {
	config    *config.Config
	resources *kubernetes.ResourceManager
}

// Status contains info about the status of the server
type ServerStatus struct {
	Running bool `json:"running"`
	SetupOK bool `json:"setupOk"`
}

// New creates a new UserTools manager
func New(config *config.Config, resources *kubernetes.ResourceManager) *UserTools {
	return &UserTools{
		config,
		resources,
	}
}

// GetStatus returns the setup and running status of UserTools for the given user
func (m *UserTools) GetStatus(ctx context.Context, u *user.User) (*ServerStatus, error) {
	status := &ServerStatus{
		SetupOK: false,
		Running: false,
	}
	codeServerSecretPresent, err := m.resources.IsSecretPresent(u.GetSecretName("codeserver"))
	if err != nil {
		return status, nil
	}
	if !codeServerSecretPresent {
		return status, nil
	}

	jupyterSecretPresent, err := m.resources.IsSecretPresent(u.GetSecretName("jupyter"))
	if err != nil {
		return status, nil
	}
	if !jupyterSecretPresent {
		return status, nil
	}

	status.SetupOK = true

	running, err := m.resources.IsUserToolsRunning(ctx, u.GetResourceName())
	if err != nil {
		return nil, err
	}

	status.Running = running

	return status, nil
}

// Start initialize a new UserTools for the given user
func (m *UserTools) Start(u *user.User) error {
	err := m.checkOrCreateToolsSecrets(u)
	if err != nil {
		return err
	}

	err = m.resources.CreateUserTools(u)
	if err != nil {
		return err
	}
	doneCh, err := m.resources.WaitUserToolsRunning(u.GetResourceName(), 10)
	if err != nil {
		return err
	}
	running := <-doneCh
	if !running {
		return fmt.Errorf("UserTools not running after %d seconds", 10)
	}
	return nil
}

// Stop stops a UserTools associated with the given user
func (m *UserTools) Stop(context context.Context, u *user.User) error {
	status, err := m.GetStatus(context, u)
	if err != nil {
		return err
	}
	if !status.SetupOK || !status.Running {
		return fmt.Errorf("can't stop uninitialized UserTools for user %s", u.GetUsernameSlug())
	}

	return m.resources.DeleteUserTools(u)
}

// checkOrCreateToolsSecrets set ClientID and ClientSecret on Kubernetes secret objects
func (m *UserTools) checkOrCreateToolsSecrets(u *user.User) error {
	fmt.Println("creating tools secrets")

	toolName := "codeserver"
	exist, err := m.resources.IsSecretPresent(u.GetSecretName(toolName))
	if err != nil {
		return fmt.Errorf("check %s tool secret: %w", toolName, err)
	}
	if !exist {
		callbackURL := fmt.Sprintf("http://%s-code.%s/oauth2/callback", u.GetUsernameSlug(), m.config.BaseDomainName)
		data := map[string]string{}
		data["DEPLOYMENT_SECRET_NAME"] = u.GetSecretName(toolName)
		data["OAUTH2_CREDENTIALS_PREFIX"] = "CODESERVER"
		data["GITEA_REDIRECT_URIS"] = callbackURL
		data["GITEA_APPLICATION_NAME"] = u.GetOAuthName(toolName)
		data["CODESERVER_OAUTH2_CALLBACK_URL"] = callbackURL
		data["CODESERVER_OAUTH2_INITIALIZED"] = "no"

		err := m.resources.CreateSecret(u.GetSecretName(toolName), data)
		if err != nil {
			return fmt.Errorf("creating %s tools secrets: %w", toolName, err)
		}
	}

	toolName = "jupyter"
	exist, err = m.resources.IsSecretPresent(u.GetSecretName(toolName))
	if err != nil {
		return fmt.Errorf("check %s tool secret: %w", toolName, err)
	}
	if !exist {
		callbackURL := fmt.Sprintf("http://%s-jupyter.%s/oauth2/callback", u.GetUsernameSlug(), m.config.BaseDomainName)
		data := map[string]string{}
		data["DEPLOYMENT_SECRET_NAME"] = u.GetSecretName(toolName)
		data["OAUTH2_CREDENTIALS_PREFIX"] = "JUPYTER"
		data["GITEA_REDIRECT_URIS"] = callbackURL
		data["GITEA_APPLICATION_NAME"] = u.GetOAuthName(toolName)
		data["JUPYTER_OAUTH2_CALLBACK_URL"] = callbackURL
		data["JUPYTER_OAUTH2_INITIALIZED"] = "no"

		err = m.resources.CreateSecret(u.GetSecretName(toolName), data)
		if err != nil {
			return fmt.Errorf("creating %s tools secrets: %w", toolName, err)
		}
	}

	return nil
}

// WaitUserToolsRunning waits for user resources to be on running state
func (m *UserTools) WaitUserToolsRunning(ctx context.Context, u *user.User) (*ServerStatus, error) {
	status := &ServerStatus{
		SetupOK: false,
		Running: false,
	}

	err := m.resources.WaitForUserToolsRunning(ctx, u)
	if err != nil {
		return nil, err
	}

	status.Running = true

	return status, nil
}
