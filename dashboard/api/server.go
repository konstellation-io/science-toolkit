package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"toolkit/dashboard/codeserver"
)

// Server contains methods to handle API requests
type Server struct {
	manager *codeserver.CodeServer
}

// New returns a new instance of the API Server
func New(manager *codeserver.CodeServer) *Server {
	return &Server{
		manager,
	}
}

// StartCodeServer starts a new instance of VS Code Server
func (s *Server) StartCodeServer(c *gin.Context) {
	fmt.Printf("starting server\n")
	u := c.MustGet("user").(codeserver.User)
	status, err := s.manager.GetStatus(u)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if status.Running {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CodeServer already running"})
		return
	}
	err = s.manager.Start(u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// StopCodeServer stops an existing instance of VS Code Server
func (s *Server) StopCodeServer(c *gin.Context) {
	u := c.MustGet("user").(codeserver.User)

	status, err := s.manager.GetStatus(u)
	if err != nil {
		fmt.Printf("error stopping CodeServer: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err})
		return
	}

	if !status.Running {
		fmt.Printf("server is not running\n")
		c.JSON(http.StatusBadRequest, gin.H{"error": "CodeServer is not running"})
		return
	}

	err = s.manager.Stop(u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, status)
}

// StatusCodeServer stops an existing instance of VS Code Server
func (s *Server) StatusCodeServer(c *gin.Context) {
	u := c.MustGet("user").(codeserver.User)

	status, err := s.manager.GetStatus(u)
	if err != nil {
		fmt.Printf("error getting CodeServer status: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"running": status.Running})
}
