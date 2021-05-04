package utils

import "os/exec"

func AddGitUserName(userName string) error {
	cmd := exec.Command("git", "config", "--global", "user.name", userName)
	return cmd.Run()
}

func AddGitEmail(email string) error {
	cmd := exec.Command("git", "config", "--global", "user.email", email)
	return cmd.Run()
}
