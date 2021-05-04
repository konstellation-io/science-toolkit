package repository

import (
	"context"
	"time"
	"user-repo-cloner/config"

	"github.com/konstellation-io/kdl-server/app/api/entity"
	"github.com/konstellation-io/kdl-server/app/api/pkg/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type ProjectMongoDBRepo struct {
	cfg        config.Config
	logger     logging.Logger
	collection *mongo.Collection
}

type Project struct {
	ID              string                `bson:"_id"`
	Name            string                `bson:"name"`
	RepositoryType  entity.RepositoryType `bson:"repo_type"`
	RepoName        string                `bson:"repo_name"`
	ExternalRepoURL string                `bson:"external_repo_url"`
}

func NewProjectMongoDBRepo(cfg config.Config, logger logging.Logger, client *mongo.Client) *ProjectMongoDBRepo {
	collection := client.Database(cfg.MongoDB.DBName).Collection(cfg.MongoDB.ProjectsCollName)
	return &ProjectMongoDBRepo{cfg, logger, collection}
}

func (p *ProjectMongoDBRepo) FindUserRepos(userID primitive.ObjectID) ([]Project, error) {
	ctx, cancel := context.WithTimeout(context.Background(), time.Duration(p.cfg.CheckFrequencySeconds)*time.Second)
	defer cancel()

	projection := bson.M{
		"name":               1,
		"repo_type":          1,
		"internal_repo_name": 1,
		"external_repo_url":  1,
	}

	findOptions := options.Find().SetProjection(projection)

	filter := bson.M{"members.user_id": userID}
	cursor, err := p.collection.Find(ctx, filter, findOptions)

	if err != nil {
		return nil, err
	}

	var projects []Project

	err = cursor.All(ctx, &projects)
	if err != nil {
		return nil, err
	}

	return projects, nil
}
