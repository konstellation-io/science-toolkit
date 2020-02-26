package kubernetes

import (
	"fmt"
	"time"

	v1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"k8s.io/client-go/dynamic"
	"k8s.io/client-go/kubernetes"

	"toolkit/dashboard/config"
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
		Resource: "codeservers",
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
	if err != nil {
		return false, err
	}

	return !errors.IsNotFound(err), nil

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

// IsCodeServerRunning check if the there is a server for the given username
func (r *ResourceManager) IsCodeServerRunning(name string) (bool, error) {
	codeServer, err := r.codeClient.Namespace(r.config.Kubernetes.Namespace).Get(name, metav1.GetOptions{})
	if errors.IsNotFound(err) {
		return false, nil
	}
	if err != nil {
		return false, err
	}

	fmt.Println("server: ", codeServer)
	return true, nil
}

// CreateCodeServer creates a new crd of type CodeServer for the given user
func (r *ResourceManager) CreateCodeServer(serverName, username string) error {
	definition := &unstructured.Unstructured{
		Object: map[string]interface{}{
			"kind":       "CodeServer",
			"apiVersion": r.apiVersion,
			"metadata": map[string]interface{}{
				"name":      serverName,
				"namespace": r.config.Kubernetes.Namespace,
				"labels": map[string]interface{}{
					"app": serverName,
				},
			},
			"spec": map[string]interface{}{
				"domain":   r.config.BaseDomainName,
				"username": username,
			},
		},
	}
	_, err := r.codeClient.Namespace(r.config.Kubernetes.Namespace).Create(definition, metav1.CreateOptions{})
	if err != nil {
		return err
	}
	fmt.Println("CodeServer created")

	return nil
}

// DeleteCodeServer deletes a crd of type CodeServer
func (r ResourceManager) DeleteCodeServer(name string) error {
	return r.codeClient.Namespace(r.config.Kubernetes.Namespace).Delete(name, &metav1.DeleteOptions{})
}

// WaitCodeServerRunning waits until the CodeServer pod is running
func (r *ResourceManager) WaitCodeServerRunning(name string, timeToWait time.Duration) (chan bool, error) {
	waitChan := make(chan bool)

	labelSelector := fmt.Sprintf("app=codeserver-%s", name)

	fmt.Printf("Creating watcher for POD with labels: %s\n", labelSelector)

	watch, err := r.clientset.CoreV1().Pods(r.config.Kubernetes.Namespace).Watch(metav1.ListOptions{
		TypeMeta:      metav1.TypeMeta{},
		LabelSelector: labelSelector,
		FieldSelector: "",
	})

	if err != nil {
		return nil, fmt.Errorf("failed to set up watch for pod (error: %v)", err)
	}

	go func() {
		events := watch.ResultChan()

		startTime := time.Now()
		for {
			select {
			case event := <-events:
				pod := event.Object.(*v1.Pod)

				if pod.Status.Phase == v1.PodRunning {
					fmt.Printf("The POD with labels \"%s\" is running\n", labelSelector)
					watch.Stop()
					waitChan <- true
					close(waitChan)
					return
				}
			case <-time.After((timeToWait * time.Second) - time.Since(startTime)):
				watch.Stop()
				waitChan <- false
				close(waitChan)
				return
			}
		}
	}()

	return waitChan, nil
}
