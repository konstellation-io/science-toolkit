package main

import (
	"context"
	"os"
	"strings"
	"time"
	"user-repo-cloner/config"

	"github.com/konstellation-io/kdl-server/app/api/entity"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/transport/ssh"
	"github.com/konstellation-io/kdl-server/app/api/pkg/mongodb"
	"github.com/konstellation-io/kre/libs/simplelogger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	ssh2 "golang.org/x/crypto/ssh"
)

type projectDTO struct {
	ProjectName      string                `json:"projectName" bson:"name"`
	RepositoryType   entity.RepositoryType `json:"repositoryType" bson:"repo_type"`
	InternalRepoName string                `json:"internalRepoName" bson:"internal_repo_name"`
	ExternalRepoURL  string                `json:"externalRepoURL" bson:"external_repo_url"`
}

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

	userID, err := getUserID(cfg.UsrName, mongodbClient, cfg)
	if err != nil {
		logger.Errorf("Error retrieving user %s: %s", cfg.UsrName, err)
		os.Exit(1)
	}

	defer mongoDriver.Disconnect()

	projectCollection := mongodbClient.Database(cfg.MongoDB.DBName).Collection(cfg.MongoDB.ProjectsCollName)
	ticker := time.NewTicker(time.Duration(cfg.CheckFrequencySeconds) * time.Second)

	for range ticker.C {
		checkAndCloneNewRepos(userID, projectCollection, logger, cfg)
	}
}

func getUserID(userName string, mongodbClient *mongo.Client, cfg config.Config) (primitive.ObjectID, error) {
	userCollection := mongodbClient.Database(cfg.MongoDB.DBName).Collection(cfg.MongoDB.UsersCollName)

	var userID bson.M

	projection := bson.D{
		primitive.E{Key: "_id", Value: 1},
	}
	findOptions := options.FindOne().SetProjection(projection)
	err := userCollection.FindOne(context.Background(), bson.M{"username": userName}, findOptions).Decode(&userID)

	if err != nil {
		return primitive.ObjectID{}, err
	}

	return userID["_id"].(primitive.ObjectID), nil
}

func checkAndCloneNewRepos(userID primitive.ObjectID, projectCollection *mongo.Collection,
	logger simplelogger.SimpleLoggerInterface, cfg config.Config) {
	projects, err := checkNewRepos(userID, projectCollection)
	if err != nil {
		logger.Errorf("Error checking new repos: %s", err)
		return
	}

	for _, dto := range projects {
		url := ""
		repoName := ""

		if dto.RepositoryType == entity.RepositoryTypeExternal {
			url = dto.ExternalRepoURL
			repoName = dto.ProjectName
		} else if dto.RepositoryType == entity.RepositoryTypeInternal {
			url = cfg.RepoURLGeneric + dto.InternalRepoName + ".git"
			repoName = dto.InternalRepoName
		}

		if url != "" {
			go cloneRepo(url, repoName, logger, cfg)
		} else {
			logger.Errorf("Error obtaining repo URL for project with name %s", dto.ProjectName)
		}
	}
}

func checkNewRepos(userID primitive.ObjectID, projectCollection *mongo.Collection) ([]projectDTO, error) {
	ctx := context.Background()

	projection := bson.D{
		primitive.E{Key: "name", Value: 1},
		primitive.E{Key: "repo_type", Value: 1},
		primitive.E{Key: "internal_repo_name", Value: 1},
		primitive.E{Key: "external_repo_url", Value: 1},
	}

	findOptions := options.Find().SetProjection(projection)

	filter := bson.M{"members.user_id": userID}
	cursor, err := projectCollection.Find(ctx, filter, findOptions)

	if err != nil {
		return nil, err
	}

	var projects []projectDTO

	for cursor.Next(context.Background()) {
		project := projectDTO{}
		err := cursor.Decode(&project)

		if err != nil {
			return nil, err
		}

		projects = append(projects, project)
	}

	return projects, nil
}

func cloneRepo(repoURL, repoName string, logger simplelogger.SimpleLoggerInterface, cfg config.Config) {
	path := cfg.PathGeneric + repoName

	if _, err := os.Stat(path); !os.IsNotExist(err) {
		return
	}

	logger.Debugf("Repository %s with URL %s found. Clone starting", repoName, repoURL)

	auth, err := ssh.NewPublicKeysFromFile("git", cfg.PemFile, cfg.PemFilePassword)
	if err != nil {
		logger.Error("Error with rsa key. Aborting clone.")
		return
	}

	// nolint:gosec // needed to accept handshake
	auth.HostKeyCallback = ssh2.InsecureIgnoreHostKey()

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
