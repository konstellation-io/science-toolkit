package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
)

// Credentials to be returned to create a configMap
type Credentials struct {
	ClientID     string `json:"client_id"`
	ClientSecret string `json:"client_secret"`
}

func checkGitea(url, username, password string) bool {

	req, err := http.NewRequest("GET", fmt.Sprintf("%s/api/v1/user", url), nil)
	if err != nil {
		log.Printf("error calling Gitea: %w \n", err)
		log.Println("Connection with Gitea fail, retrying.")
		return false
	}
	req.SetBasicAuth(username, password)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println(err)
		return false
	}
	log.Printf("Gitea response status: %d \n", resp.StatusCode)

	return resp.StatusCode == http.StatusOK

}

func createOauth2Application(name string, redirectUris []string, url, username, password string) (*Credentials, error) {

	payload := map[string]interface{}{
		"name":          name,
		"redirect_uris": redirectUris,
	}
	payloadData, err := json.Marshal(&payload)
	if err != nil {
		log.Printf("payload conversion error: %w \n", err)
		return nil, err
	}
	req, err := http.NewRequest("POST", fmt.Sprintf("%s/api/v1/user/applications/oauth2", url), bytes.NewBuffer(payloadData))
	if err != nil {
		log.Printf("error calling Gitea when creating Oauth2 Application: %w \n", err)
		log.Println("Connection with Gitea fail, retrying.")
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.SetBasicAuth(username, password)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		log.Println(err)
		return nil, err
	}

	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)

	c := &Credentials{}
	err = json.Unmarshal(body, c)

	return c, err
}
