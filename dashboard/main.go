package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"

	"toolkit/dashboard/api"
	"toolkit/dashboard/config"
	"toolkit/dashboard/kubernetes"
	"toolkit/dashboard/usertools"
)

func main() {
	r := gin.Default()
	gin.DisableConsoleColor()

	cfg := config.New()
	manager := kubernetes.New(cfg)
	codeServer := usertools.New(cfg, manager)

	s := api.New(codeServer)

	// API routes
	api := r.Group("/api", api.ReadUser())
	api.POST("/start", s.StartUserTools)
	api.POST("/stop", s.StopUserTools)
	api.POST("/status", s.StatusUserTools)

	// Static routes
	r.Static("index.html", "./static/")
	r.StaticFS("/static", http.Dir("static"))
	r.StaticFile("/", "./static/index.html")

	log.Fatal(r.Run(fmt.Sprintf("0.0.0.0:%s", cfg.Server.Port)))
}
