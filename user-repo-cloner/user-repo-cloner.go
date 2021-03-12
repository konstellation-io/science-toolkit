package main

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"time"

	"github.com/konstellation-io/kdl-server/app/api/pkg/logging"

	"user-repo-cloner/config"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/transport/ssh"
	"github.com/konstellation-io/kdl-server/app/api/entity"
	"github.com/konstellation-io/kdl-server/app/api/pkg/mongodb"
	"github.com/konstellation-io/kre/libs/simplelogger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type projectDTO struct {
	Name             string                `bson:"name"`
	RepositoryType   entity.RepositoryType `bson:"repo_type"`
	InternalRepoName string                `bson:"internal_repo_name"`
	ExternalRepoURL  string                `bson:"external_repo_url"`
}

type userDTO struct {
	ID       primitive.ObjectID `bson:"_id"`
	Username string             `bson:"username"`
	Email    string             `bson:"email"`
}

var (
	// This regexp extracts the repository name from a https URL like:
	//  https://github.com/konstellation-io/kre.git
	repoNameRegexp = regexp.MustCompile(`([^/]+)\.git$`)

	// This regexp extracts the host name from a https URL like:
	//  https://github.com/konstellation-io/kre.git
	repoHostnameRegexp = regexp.MustCompile(`^https://([^/]+)`)

	errInvalidRepoURL = errors.New("the repository URL is invalid")
)

func main() {
	cfg := config.NewConfig()

	var level simplelogger.LogLevel

	switch strings.ToLower(cfg.LogLevel) {
	case "debug":
		level = simplelogger.LevelDebug
	case "info":
		level = simplelogger.LevelInfo
	case "warn":
		level = simplelogger.LevelWarn
	case "error":
		level = simplelogger.LevelError
	}

	logger := simplelogger.New(level)
	mongoDriver := mongodb.NewMongoDB(logger)

	mongodbClient, err := mongoDriver.Connect(cfg.MongoDB.URI)
	if err != nil {
		logger.Errorf("Error connecting to MongoDB: %s", err)
		os.Exit(1)
	}

	userData, err := getUserData(cfg.UsrName, mongodbClient, cfg)
	if err != nil {
		logger.Errorf("Error retrieving user %s: %s", cfg.UsrName, err)
		os.Exit(1)
	}

	err = addGitUserName(userData.Username)
	if err != nil {
		logger.Errorf("Error setting git username: %s. You'll need to do manually", err)
	}

	err = addGitEmail(userData.Email)
	if err != nil {
		logger.Errorf("Error setting git email: %s. You'll need to do manually", err)
	}

	defer mongoDriver.Disconnect()

	projectCollection := mongodbClient.Database(cfg.MongoDB.DBName).Collection(cfg.MongoDB.ProjectsCollName)
	ticker := time.NewTicker(time.Duration(cfg.CheckFrequencySeconds) * time.Second)

	err = addToKnownHost("gitea", logger)
	if err != nil {
		logger.Errorf("Error adding gitea to known hosts: %s", err)
	}

	checkAndCloneNewRepos(userData.ID, projectCollection, logger, cfg)

	for range ticker.C {
		checkAndCloneNewRepos(userData.ID, projectCollection, logger, cfg)
	}
}

func getUserData(userName string, mongodbClient *mongo.Client, cfg config.Config) (userDTO, error) {
	userCollection := mongodbClient.Database(cfg.MongoDB.DBName).Collection(cfg.MongoDB.UsersCollName)

	user := userDTO{}

	projection := bson.M{
		"_id":      1,
		"username": 1,
		"email":    1,
	}
	findOptions := options.FindOne().SetProjection(projection)
	err := userCollection.FindOne(context.Background(), bson.M{"username": userName}, findOptions).Decode(&user)

	if err != nil {
		return userDTO{}, err
	}

	return user, nil
}

func addGitUserName(userName string) error {
	cmd := exec.Command("git", "config", "--global", "user.name", userName)
	return cmd.Run()
}

func addGitEmail(email string) error {
	cmd := exec.Command("git", "config", "--global", "user.email", email)
	return cmd.Run()
}

func isKnownHost(host string) bool {
	cmd := exec.Command("ssh-keygen", "-F", host)
	err := cmd.Run()

	return err == nil
}

func addToKnownHost(host string, logger logging.Logger) error {
	if isKnownHost(host) {
		logger.Infof("%s is a known host", host)
		return nil
	}

	sshKeyScanCmd := fmt.Sprintf("ssh-keyscan -H %s >> /home/kdl/.ssh/known_hosts", host)
	cmd := exec.Command("sh", "-c", sshKeyScanCmd)

	err := cmd.Run()
	if err != nil {
		return err
	}

	logger.Infof("Added %s to known host", host)

	return nil
}

func getRepoNameFromURL(url string) (string, error) {
	const expectedMatches = 2

	matches := repoNameRegexp.FindStringSubmatch(url)
	if len(matches) != expectedMatches {
		return "", errInvalidRepoURL
	}

	return matches[1], nil
}

func getRepoHostnameFromURL(url string) (string, error) {
	const expectedMatches = 2

	matches := repoHostnameRegexp.FindStringSubmatch(url)
	if len(matches) != expectedMatches {
		return "", errInvalidRepoURL
	}

	return matches[1], nil
}

func checkAndCloneNewRepos(userID primitive.ObjectID, projectCollection *mongo.Collection,
	logger simplelogger.SimpleLoggerInterface, cfg config.Config) {
	projects, err := checkNewRepos(userID, projectCollection, cfg)
	if err != nil {
		logger.Errorf("Error checking new repos: %s", err)
		return
	}

	for _, dto := range projects {
		url := ""
		repoName := ""

		switch dto.RepositoryType {
		case entity.RepositoryTypeExternal:
			url = strings.Replace(dto.ExternalRepoURL, "https://", "ssh://git@", 1)

			repoName, err = getRepoNameFromURL(dto.ExternalRepoURL)
			if err != nil {
				logger.Errorf("Error getting the repository name from URL: %s", dto.ExternalRepoURL)
				return
			}

		case entity.RepositoryTypeInternal:
			url = cfg.InternalRepoBaseURL + dto.InternalRepoName + ".git"
			repoName = dto.InternalRepoName
		}

		if url != "" {
			go cloneRepo(url, repoName, logger, cfg, dto)
		} else {
			logger.Errorf("Error obtaining repo URL for project with name %s", dto.Name)
		}
	}
}

func checkNewRepos(userID primitive.ObjectID, projectCollection *mongo.Collection, cfg config.Config) ([]projectDTO, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(cfg.CheckFrequencySeconds)*time.Second)
	defer cancel()

	projection := bson.M{
		"name":               1,
		"repo_type":          1,
		"internal_repo_name": 1,
		"external_repo_url":  1,
	}

	findOptions := options.Find().SetProjection(projection)

	filter := bson.M{"members.user_id": userID}
	cursor, err := projectCollection.Find(ctx, filter, findOptions)

	if err != nil {
		return nil, err
	}

	var projects []projectDTO

	err = cursor.All(ctx, &projects)
	if err != nil {
		return nil, err
	}

	return projects, nil
}

func cloneRepo(repoURL, repoName string, logger simplelogger.SimpleLoggerInterface, cfg config.Config, dto projectDTO) {
	path := cfg.ReposPath + repoName

	if _, err := os.Stat(path); !os.IsNotExist(err) {
		return
	}

	if dto.RepositoryType == entity.RepositoryTypeExternal {
		hostname, err := getRepoHostnameFromURL(dto.ExternalRepoURL)
		if err != nil {
			logger.Errorf("Error getting the repository hostname from URL: %s", dto.ExternalRepoURL)
			return
		}

		err = addToKnownHost(hostname, logger)
		if err != nil {
			logger.Errorf("Error adding %s to known hosts", hostname)
			return
		}
	}

	logger.Debugf("Repository %s with URL %s found. Clone starting", repoName, repoURL)

	auth, err := ssh.NewPublicKeysFromFile("git", cfg.PemFile, cfg.PemFilePassword)
	if err != nil {
		logger.Errorf("Error with rsa key: %s Aborting clone.", err)
		return
	}

	_, err = git.PlainClone(path, false, &git.CloneOptions{
		URL:      repoURL,
		Progress: os.Stdout,
		Auth:     auth,
	})

	if err != nil {
		logger.Errorf("Error cloning repository: %s", err)

		if _, err := os.Stat(path); os.IsNotExist(err) {
			err := os.RemoveAll(path)
			if err != nil {
				logger.Errorf("Error deleting repo folder: %s", err)
			}
		}

		return
	}

	logger.Infof("Repository %s successfully created", repoName)
}
