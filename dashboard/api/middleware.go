package api

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"toolkit/dashboard/usertools"
)

// Headers contains headers to read from requests
type RequestHeaders struct {
	Username string `header:"X-Forwarded-User"`
}

// ReadUser reads the user from the request headers
func ReadUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		h := RequestHeaders{}
		if err := c.ShouldBindHeader(&h); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("%s: invalid username", err)})
			return
		}

		c.Header("x-forwarded-user", h.Username)
		if h.Username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid username"})
			return
		}

		c.Set("user", usertools.User{
			Username: h.Username,
		})

		c.Next()
	}
}
