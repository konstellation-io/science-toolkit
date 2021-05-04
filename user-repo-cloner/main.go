package main

import (
	"os"
	"strings"
	"user-repo-cloner/cloner"

	"github.com/konstellation-io/kdl-server/app/api/pkg/mongodb"
	"github.com/konstellation-io/kre/libs/simplelogger"

	"user-repo-cloner/config"
	"user-repo-cloner/repository"
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
	mongoManager := mongodb.NewMongoDB(logger)

	mongodbClient, err := mongoManager.Connect(cfg.MongoDB.URI)
	if err != nil {
		logger.Errorf("Error connecting to MongoDB: %s", err)
		os.Exit(1)
	}

	defer mongoManager.Disconnect()

	projectRepo := repository.NewProjectMongoDBRepo(cfg, logger, mongodbClient)
	userRepo := repository.NewUserMongoDBRepo(cfg, logger, mongodbClient)

	repoCloner := cloner.NewUserRepoCloner(cfg, logger, projectRepo, userRepo)
	repoCloner.Start()
}
