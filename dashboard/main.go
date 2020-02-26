package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"toolkit/dashboard/api"
	"toolkit/dashboard/codeserver"
	"toolkit/dashboard/config"
	"toolkit/dashboard/kubernetes"
)

func main() {
	r := gin.Default()
	gin.DisableConsoleColor()

	cfg := config.New()
	manager := kubernetes.New(cfg)
	codeServer := codeserver.New(cfg, manager)

	s := api.New(codeServer)

	// API routes
	api := r.Group("/api", api.ReadUser())
	api.POST("/start", s.StartCodeServer)
	api.POST("/stop", s.StopCodeServer)
	api.GET("/status", s.StatusCodeServer)

	// Static routes
	r.Static("index.html", "./static/")
	r.StaticFS("/static", http.Dir("static"))
	r.StaticFile("/", "./static/index.html")

	log.Fatal(r.Run(fmt.Sprintf("0.0.0.0:%s", cfg.Server.Port)))
}
