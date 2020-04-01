package api

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"

	"toolkit/dashboard/user"
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

		if h.Username == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid username"})
			return
		}
		u := user.User{
			Username: h.Username,
		}
		c.Header("x-forwarded-user", h.Username)
		c.Header("x-forwarded-user-slug", u.GetUsernameSlug())
		c.Set("user", u)

		c.Next()
	}
}
