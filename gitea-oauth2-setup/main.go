package main

import (
	"log"
	"os"
	"time"
)


func main() {

	cfg, err := NewConfig()
	if err != nil {
		log.Fatal("creating config: %s", err)
	}
	k8s := NewK8s(cfg)

	initialized, err := k8s.VerifySecretsCredentials()
	if err != nil {
		log.Fatalf("fail checking secret credentials: %s ", err)
		return
	}
	if initialized {
		log.Println("Done")
		os.Exit(0)
	}

	doneCh := make(chan struct{})
	go func() {
		for {
			giteaAvailable := checkGitea(cfg.Gitea.URL, cfg.Gitea.Username, cfg.Gitea.Password)
			if giteaAvailable {
				credentials, err := createOauth2Application(cfg.Gitea.Name, cfg.Gitea.RedirectUris, cfg.Gitea.URL, cfg.Gitea.Username, cfg.Gitea.Password)
				if err != nil {
					log.Fatal("can not create the application in Gitea: %s", err)
				}
				err = k8s.UpdateSecretCredentials(credentials)
				if err != nil {
					log.Fatal("can not update Kubernetes secrets: %s", err)
				}
				doneCh <- struct{}{}
				return
			}
			time.Sleep(10 * time.Second)
		}
	}()
	for {
		select {
		case <-doneCh:
			log.Println("Done")
			os.Exit(0)
		case <-time.After(time.Duration(cfg.Timeout) * time.Second):
			log.Printf("error, timeout after %d seconds.\n", cfg.Timeout)
			os.Exit(1)
		}

	}

}
