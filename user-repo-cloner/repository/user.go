package repository

import (
	"context"
	"user-repo-cloner/config"

	"github.com/konstellation-io/kdl-server/app/api/pkg/logging"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type User struct {
	ID       primitive.ObjectID `bson:"_id"`
	Username string             `bson:"username"`
	Email    string             `bson:"email"`
}

type UserMongoDBRepo struct {
	cfg        config.Config
	logger     logging.Logger
	collection *mongo.Collection
}

// NewUserMongoDBRepo implements user.Repository interface.
func NewUserMongoDBRepo(cfg config.Config, logger logging.Logger, client *mongo.Client) *UserMongoDBRepo {
	collection := client.Database(cfg.MongoDB.DBName).Collection(cfg.MongoDB.UsersCollName)
	return &UserMongoDBRepo{cfg, logger, collection}
}

func (u *UserMongoDBRepo) GetUser(userName string) (User, error) {
	user := User{}

	projection := bson.M{
		"_id":      1,
		"username": 1,
		"email":    1,
	}
	findOptions := options.FindOne().SetProjection(projection)
	err := u.collection.FindOne(context.Background(), bson.M{"username": userName}, findOptions).Decode(&user)

	if err != nil {
		return User{}, err
	}

	return user, nil
}
