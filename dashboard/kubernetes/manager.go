package kubernetes

import (
	"context"
	"errors"
	"fmt"
	"time"

	v1 "k8s.io/api/core/v1"
	k8s_errors "k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/apimachinery/pkg/watch"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"

	"toolkit/dashboard/config"
	"toolkit/dashboard/user"
)

// ResourceManager interacts with kubernetes
type ResourceManager struct {
	config     *config.Config
	clientset  *kubernetes.Clientset
	codeClient dynamic.NamespaceableResourceInterface
	apiVersion string
}

// New returns a new instance of type ResourceManager
func New(config *config.Config) *ResourceManager {
	group := schema.GroupVersionResource{
		Group:    "sci-toolkit.konstellation.io",
		Version:  "v1alpha1",
		Resource: "usertools",
	}

	clientset := newClientset(config)
	dynClient := newDynamicClient(config)

	apiVersion := group.Group + "/v1alpha1"
	codeClient := dynClient.Resource(group)

	return &ResourceManager{
		config,
		clientset,
		codeClient,
		apiVersion,
	}
}

// IsSecretPresent checks if there is a secret with the given name
func (r *ResourceManager) IsSecretPresent(name string) (bool, error) {
	_, err := r.clientset.CoreV1().Secrets(r.config.Kubernetes.Namespace).Get(name, metav1.GetOptions{})
	if err != nil && !k8s_errors.IsNotFound(err) {
		return false, err
	}

	return !k8s_errors.IsNotFound(err), nil
}

// CreateSecret creates a secret on kubernetes with the given data
func (r *ResourceManager) CreateSecret(name string, input map[string]string) error {
	data := map[string][]byte{}
	for k, v := range input {
		data[k] = []byte(v)
	}
	_, err := r.clientset.CoreV1().Secrets(r.config.Kubernetes.Namespace).Create(&v1.Secret{
		TypeMeta: metav1.TypeMeta{
			Kind:       "Secret",
			APIVersion: "apps/v1beta1",
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      name,
			Namespace: r.config.Kubernetes.Namespace,
		},
		Data: data,
		Type: "Opaque",
	})

	return err
}

// IsUserToolsRunning check if the there is a server for the given username
func (r *ResourceManager) IsUserToolsRunning(ctx context.Context, name string) (bool, error) {
	ns := r.config.Kubernetes.Namespace

	listOptions := metav1.ListOptions{
		LabelSelector: fmt.Sprintf("app=%s", name),
		TypeMeta: metav1.TypeMeta{
			Kind: "StatefulSet",
		},
	}
	list, err := r.codeClient.Namespace(ns).List(listOptions)
	if err != nil {
		return false, err
	}

	numPods := len(list.Items)
	return numPods != 0, nil
}

// WaitForUserToolsRunning waits for user resources to be on running state
func (r *ResourceManager) WaitForUserToolsRunning(ctx context.Context, u *user.User) error {
	ns := r.config.Kubernetes.Namespace

	ctx, cancel := context.WithTimeout(ctx, 300*time.Second)
	defer cancel()

	exist, err := r.IsUserToolsRunning(ctx, u.GetResourceName())
	if err != nil {
		return err
	}

	if exist {
		return nil
	}

	listOptions := metav1.ListOptions{
		LabelSelector: fmt.Sprintf("app=%s", u.GetResourceName()),
		TypeMeta: metav1.TypeMeta{
			Kind: "Pod",
		},
	}

	w, err := r.codeClient.Namespace(ns).Watch(listOptions)
	if err != nil {
		return err
	}
	watchResults := w.ResultChan()

	for {
		select {
		case event := <-watchResults:
			if event.Type == watch.Added {
				if pod, ok := event.Object.(*v1.Pod); ok {
					if pod.Status.Phase == v1.PodRunning {
						w.Stop()
						return nil
					}
				}
			}
		case <-ctx.Done():
			w.Stop()
			return errors.New("timeout waiting vscode pod")
		}
	}
}

// CreateUserTools creates a new crd of type UserTools for the given user
func (r *ResourceManager) CreateUserTools(user *user.User) error {
	serverName := user.GetResourceName()

	definition := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"kind":       "UserTools",
			"apiVersion": r.apiVersion,
			"metadata": map[string]interface{}{
				"name":      serverName,
				"namespace": r.config.Kubernetes.Namespace,
				"labels": map[string]interface{}{
					"app": serverName,
				},
			},
			"spec": map[string]interface{}{
				"domain":       r.config.BaseDomainName,
				"username":     user.Username,
				"usernameSlug": user.GetUsernameSlug(),
				"storage": map[string]string{
					"size":      r.config.VSCode.Storage.Size,
					"className": r.config.VSCode.Storage.ClassName,
				},
				"sharedVolume": map[string]string{
					"name": r.config.VSCode.SharedVolume.Name,
				},
				"tls": r.config.TLS,
			},
		},
	}
	fmt.Println("Creating users tools: ", definition.Object)
	_, err := r.codeClient.Namespace(r.config.Kubernetes.Namespace).Create(definition, metav1.CreateOptions{})
	if err != nil {
		return err
	}
	fmt.Println("UserTools created")

	return nil
}

// DeleteUserTools deletes a crd of type UserTools
func (r ResourceManager) DeleteUserTools(user *user.User) error {
	return r.codeClient.Namespace(r.config.Kubernetes.Namespace).Delete(user.GetResourceName(), &metav1.DeleteOptions{})
}

// WaitUserToolsRunning waits until the UserTools pod is running
func (r *ResourceManager) WaitUserToolsRunning(name string, timeToWait time.Duration) (chan bool, error) {
	waitChan := make(chan bool)

	labelSelector := fmt.Sprintf("app=%s", name)

	fmt.Printf("Creating watcher for POD with labels: %s\n", labelSelector)

	watcher, err := r.clientset.CoreV1().Pods(r.config.Kubernetes.Namespace).Watch(metav1.ListOptions{
		TypeMeta:      metav1.TypeMeta{},
		LabelSelector: labelSelector,
		FieldSelector: "",
	})

	if err != nil {
		return nil, fmt.Errorf("failed to set up watch for pod (error: %v)", err)
	}

	go func() {
		events := watcher.ResultChan()

		startTime := time.Now()
		for {
			select {
			case event := <-events:
				pod := event.Object.(*v1.Pod)

				if pod.Status.Phase == v1.PodRunning {
					fmt.Printf("The POD with labels \"%s\" is running\n", labelSelector)
					watcher.Stop()
					waitChan <- true
					close(waitChan)
					return
				}
			case <-time.After((timeToWait * time.Second) - time.Since(startTime)):
				watcher.Stop()
				waitChan <- false
				close(waitChan)
				return
			}
		}
	}()

	return waitChan, nil
}
