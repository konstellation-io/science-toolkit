package main

import (
	"context"
	"fmt"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/transport/ssh"
	"github.com/konstellation-io/kdl-server/app/api/pkg/mongodb"
	"github.com/konstellation-io/kre/libs/simplelogger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	ssh2 "golang.org/x/crypto/ssh"
	"os"
	"strings"
	"time"
	"user-repo-cloner/config"
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
	defer mongoDriver.Disconnect()

	userID, err := getUserId(cfg.UsrName, mongodbClient, cfg)
	if err != nil {
		logger.Errorf("Error retrieving user %s: %s", cfg.UsrName, err)
		os.Exit(1)
	}

	projectCollection := mongodbClient.Database(cfg.MongoDB.DBName).Collection(cfg.MongoDB.ProjectsCollName)
	ticker := time.NewTicker(time.Duration(cfg.CheckFrequencySeconds) * time.Second)
	for range ticker.C {
		checkAndCloneNewRepos(userID, projectCollection, logger, cfg)
	}
}

func getUserId(userName string, mongodbClient *mongo.Client, cfg config.Config) (primitive.ObjectID, error) {
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

func checkAndCloneNewRepos(userID primitive.ObjectID, projectCollection *mongo.Collection, logger simplelogger.SimpleLoggerInterface, cfg config.Config) {
	projects, err := checkNewRepos(userID, projectCollection, cfg)
	if err != nil {
		logger.Errorf("Error checking new repos: %s", err)
		return
	}

	for _, dto := range projects {
		repoName := fmt.Sprintf("%v", dto[cfg.MongoDB.RepoNameKey])
		if repoName == "<nil>" {
			logger.Errorf("Error extracting repository name (nil name)")
		} else {
			go cloneRepo(repoName, logger, cfg)
		}
	}

	logger.Info("Repos already updated!")
}

func checkNewRepos(userID primitive.ObjectID, projectCollection *mongo.Collection, cfg config.Config) ([]bson.M, error) {
	ctx := context.Background()

	projection := bson.D{
		primitive.E{Key: cfg.MongoDB.RepoNameKey, Value: 1},
	}
	findOptions := options.Find().SetProjection(projection)
	cursor, err := projectCollection.Find(ctx, bson.M{"members": userID}, findOptions)
	if err != nil {
		return nil, err
	}

	var projects []bson.M
	if err = cursor.All(ctx, &projects); err != nil {
		return nil, err
	}

	return projects, nil
}

func cloneRepo(repoName string, logger simplelogger.SimpleLoggerInterface, cfg config.Config) {
	repoUrl := fmt.Sprintf(cfg.RepoUrlGeneric, repoName)
	path := fmt.Sprintf(cfg.PathGeneric, repoName)

	if _, err := os.Stat(path); !os.IsNotExist(err) {
		logger.Debugf("Repository %s already exists", repoName)
		return
	}

	auth, err := ssh.NewPublicKeysFromFile("git", cfg.PemFile, cfg.PemFilePassword)
	if err != nil {
		logger.Error("error with rsa key")
	}

	auth.HostKeyCallback = ssh2.InsecureIgnoreHostKey()

	_, err = git.PlainClone(path, false, &git.CloneOptions{
		URL:      repoUrl,
		Progress: os.Stdout,
		Auth:     auth,
	})

	if err != nil {
		logger.Errorf("Error cloning repository: %s", err)
		if _, err := os.Stat(path); os.IsNotExist(err) {
			err := os.Remove(path)
			if err != nil {
				logger.Errorf("Error deleting repo folder: %s", err)
			}
		}
	} else {
		logger.Infof("Repository %s successfully created", repoName)
	}
}
