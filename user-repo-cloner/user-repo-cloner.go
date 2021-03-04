package main

import (
	"context"
	"fmt"
	"github.com/go-git/go-git/v5"
	"github.com/konstellation-io/kdl-server/app/api/pkg/mongodb"
	"github.com/konstellation-io/kre/libs/simplelogger"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"os"
	"time"
)

const (
	mongoURI        = "mongodb://admin:123456@localhost:27017"
	mongodbName     = "kdl"
	projectCollName = "projects"
	userId          = "603f7cfd95c136dd743fc525"
	repoNameKey     = "internal_repo_name"
	repoUrlGeneric  = "git@github.com:konstellation-io/%s.git"
	pathGeneric     = "/home/angel.tabar/Escritorio/tmp/%s"
)

func main() {
	var level simplelogger.LogLevel

	// cfg := config.NewConfig()
	// switch strings.ToLower(cfg.LogLevel) {
	// case "debug":
	// 	level = simplelogger.LevelDebug
	// case "info":
	// 	level = simplelogger.LevelInfo
	// case "warn":
	// 	level = simplelogger.LevelWarn
	// case "error":
	// 	level = simplelogger.LevelError
	// }

	level = simplelogger.LevelInfo
	logger := simplelogger.New(level)
	mongoDriver := mongodb.NewMongoDB(logger)

	ticker := time.NewTicker(5 * time.Second)

	mongodbClient, err := mongoDriver.Connect(mongoURI)
	if err != nil {
		logger.Errorf("Error connecting to MongoDB: %s", err)
		os.Exit(1)
	}
	defer mongoDriver.Disconnect()

	projectCollection := mongodbClient.Database(mongodbName).Collection(projectCollName)

	for range ticker.C {
		checkNewRepos(projectCollection, logger)
	}

}

func checkNewRepos(projectCollection *mongo.Collection, logger simplelogger.SimpleLoggerInterface) {
	ctx := context.Background()
	idFromHex, err := primitive.ObjectIDFromHex(userId)
	if err != nil {
		logger.Errorf("Error converting userId: %s", err)
	}

	projection := bson.D{
		{repoNameKey, 1},
	}
	findOptions := options.Find().SetProjection(projection)
	cursor, err := projectCollection.Find(ctx, bson.M{"members": idFromHex}, findOptions)
	if err != nil {
		logger.Errorf("Error retrieving projects from MongoDB: %s", err)
	}

	var projects []bson.M
	if err = cursor.All(ctx, &projects); err != nil {
		logger.Errorf("Error with cursor to projects bson: %s", err)
	}

	for _, dto := range projects {
		repoName := dto[repoNameKey]
		logger.Infof("repository: %s", repoName)
		if repoName == nil {
			logger.Errorf("Error extracting repository name (nil name)")
		} else {
			go cloneRepo(fmt.Sprintf("%v", repoName), logger)
		}

	}

	logger.Info("Done!")
}

func cloneRepo(repoName string, logger simplelogger.SimpleLoggerInterface) {
	repoUrl := fmt.Sprintf(repoUrlGeneric, repoName)
	path := fmt.Sprintf(pathGeneric, repoName)

	_, err := git.PlainClone(path, false, &git.CloneOptions{
		URL:      repoUrl,
		Progress: os.Stdout,
	})

	if err != nil {
		logger.Errorf("Error cloning repository: %s", err)
	} else {
		logger.Infof("Repository %s succesfully created", repoName)
	}
}
