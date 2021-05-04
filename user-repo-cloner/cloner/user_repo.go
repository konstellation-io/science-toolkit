package cloner

import (
	"os"
	"path"
	"strings"
	"time"

	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/transport/ssh"
	"github.com/konstellation-io/kdl-server/app/api/entity"
	"github.com/konstellation-io/kdl-server/app/api/pkg/logging"

	"user-repo-cloner/config"
	"user-repo-cloner/repository"
	"user-repo-cloner/utils"
)

type UserRepoCloner struct {
	cfg         config.Config
	logger      logging.Logger
	projectRepo *repository.ProjectMongoDBRepo
	userRepo    *repository.UserMongoDBRepo
}

func NewUserRepoCloner(
	cfg config.Config,
	logger logging.Logger,
	projectRepo *repository.ProjectMongoDBRepo,
	userRepo *repository.UserMongoDBRepo,
) *UserRepoCloner {
	return &UserRepoCloner{cfg: cfg, logger: logger, projectRepo: projectRepo, userRepo: userRepo}
}

func (c *UserRepoCloner) Start() {
	err := utils.AddToKnownHost("gitea", c.logger)
	if err != nil {
		c.logger.Errorf("Error adding gitea to known hosts: %s", err)
	}

	user := c.getUserAndInitGitConfigs()

	c.checkAndCloneNewRepos(user)

	ticker := time.NewTicker(time.Duration(c.cfg.CheckFrequencySeconds) * time.Second)
	for range ticker.C {
		c.checkAndCloneNewRepos(user)
	}
}

func (c *UserRepoCloner) getUserAndInitGitConfigs() repository.User {
	u, err := c.userRepo.GetUser(c.cfg.UsrName)
	if err != nil {
		c.logger.Errorf("Error retrieving user %s: %s", c.cfg.UsrName, err)
		os.Exit(1)
	}

	err = utils.AddGitUserName(u.Username)
	if err != nil {
		c.logger.Errorf("Error setting git username: %s. You'll need to do manually", err)
	}

	err = utils.AddGitEmail(u.Email)
	if err != nil {
		c.logger.Errorf("Error setting git email: %s. You'll need to do manually", err)
	}

	return u
}

func (c *UserRepoCloner) checkAndCloneNewRepos(user repository.User) {
	projects, err := c.projectRepo.FindUserRepos(user.ID)
	if err != nil {
		c.logger.Errorf("Error getting user repos: %s", err)
		return
	}

	projectToClone := make(map[string]repository.Project)

	for _, project := range projects {
		destPath := c.getRepoPath(project)
		if _, err := os.Stat(destPath); !os.IsNotExist(err) {
			continue
		}

		projectToClone[project.ID] = project
	}

	if len(projectToClone) == 0 {
		return
	}

	c.logger.Infof("Found %d new repositories to clone", len(projectToClone))

	for _, project := range projectToClone {
		go c.cloneRepo(project)
	}
}

func (c *UserRepoCloner) cloneRepo(project repository.Project) {
	destPath := c.getRepoPath(project)
	repoURL := ""

	switch project.RepositoryType {
	case entity.RepositoryTypeExternal:
		repoURL = strings.Replace(project.ExternalRepoURL, "https://", "ssh://git@", 1)

		hostname, err := utils.GetRepoHostnameFromURL(project.ExternalRepoURL)
		if err != nil {
			c.logger.Errorf("Error getting the repository hostname from URL: %s", project.ExternalRepoURL)
			return
		}

		err = utils.AddToKnownHost(hostname, c.logger)
		if err != nil {
			c.logger.Errorf("Error adding %s to known hosts", hostname)
			return
		}

	case entity.RepositoryTypeInternal:
		repoURL = c.cfg.InternalRepoBaseURL + project.ID + ".git"
	}

	c.logger.Debugf("Repository %s with URL %s found. Clone starting", project.ID, repoURL)

	auth, err := ssh.NewPublicKeysFromFile("git", c.cfg.PemFile, c.cfg.PemFilePassword)
	if err != nil {
		c.logger.Errorf("Error with rsa key: %s Aborting clone.", err)
		return
	}

	_, err = git.PlainClone(destPath, false, &git.CloneOptions{
		URL:      repoURL,
		Progress: os.Stdout,
		Auth:     auth,
	})

	if err != nil {
		c.logger.Errorf("Error cloning repository: %s", err)

		if _, err := os.Stat(destPath); os.IsNotExist(err) {
			err := os.RemoveAll(destPath)
			if err != nil {
				c.logger.Errorf("Error deleting repo folder: %s", err)
			}
		}

		return
	}

	c.logger.Infof("Repository \"%s\" (%s) successfully created", project.ID, repoURL)
}

func (c *UserRepoCloner) getRepoPath(project repository.Project) string {
	return path.Join(c.cfg.ReposPath, project.ID)
}
