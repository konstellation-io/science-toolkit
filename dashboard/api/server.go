package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"toolkit/dashboard/usertools"
)

// Server contains methods to handle API requests
type Server struct {
	manager *usertools.UserTools
}

// New returns a new instance of the API Server
func New(manager *usertools.UserTools) *Server {
	return &Server{
		manager,
	}
}

// StartUserTools starts a new instance of UserTools
func (s *Server) StartUserTools(c *gin.Context) {
	fmt.Printf("starting server\n")
	u := c.MustGet("user").(usertools.User)
	status, err := s.manager.GetStatus(c.Request.Context(), u)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if status.Running {
		c.JSON(http.StatusBadRequest, gin.H{"error": "UserTools already running"})
		return
	}
	err = s.manager.Start(u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusNoContent, nil)
}

// StopUserTools stops an existing instance of UserTools
func (s *Server) StopUserTools(c *gin.Context) {
	u := c.MustGet("user").(usertools.User)

	status, err := s.manager.GetStatus(c.Request.Context(), u)
	if err != nil {
		fmt.Printf("error stopping UserTools: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err})
		return
	}

	if !status.Running {
		fmt.Printf("server is not running\n")
		c.JSON(http.StatusBadRequest, gin.H{"error": "UserTools is not running"})
		return
	}

	err = s.manager.Stop(c.Request.Context(), u)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, status)
}

// StatusUserTools stops an existing instance of UserTools
func (s *Server) StatusUserTools(c *gin.Context) {
	u := c.MustGet("user").(usertools.User)

	status, err := s.manager.GetStatus(c.Request.Context(), u)
	if err != nil {
		fmt.Printf("error getting UserTools status: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"running": status.Running})
}

// WaitUserToolsRunning wait for a statefulSet resource on running state.
func (s *Server) WaitUserToolsRunning(c *gin.Context) {
	u := c.MustGet("user").(usertools.User)

	status, err := s.manager.WaitUserToolsRunning(c.Request.Context(), u)
	if err != nil {
		fmt.Printf("error on wait UserTools running status: %s\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"running": status.Running})
}
