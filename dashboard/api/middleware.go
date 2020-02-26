package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"toolkit/dashboard/codeserver"
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

		// TODO: REMOVE DEBUG
		h.Username = "gustavo"

		c.Header("x-forwarded-user", h.Username)

		if h.Username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid username"})
			return
		}

		c.Set("user", codeserver.User{
			Username: h.Username,
		})

		c.Next()
	}
}
