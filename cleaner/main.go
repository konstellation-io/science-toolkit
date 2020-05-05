package main

import (
	"fmt"
	"os"
	"path/filepath"
	"time"
)

func main() {
	trashPath := "./.trash"
	var trashFiles []string
	var trashDirs []string

	var daysThreshold = int(0)
	loc, _ := time.LoadLocation("UTC")
	now := time.Now().In(loc)

	err := filepath.Walk(trashPath, func(path string, info os.FileInfo, err error) error {

		diff := now.Sub(info.ModTime())
		days := int(diff.Hours() / 24)

		if days >= daysThreshold {

			if info.IsDir() {
				trashDirs = append(trashDirs, path)
			} else {
				trashFiles = append(trashFiles, path)
			}
		}
		return nil
	})
	if err != nil {
		panic(err)
	}

	fmt.Println("---------Files----------------")
	for _, trashFile := range trashFiles {
		fmt.Println("Remove file: ", trashFile)
		os.Remove(trashFile)

	}

	fmt.Println("---------Folders----------------")
	for _, trashDir := range trashDirs {
		if trashDir != trashPath {
			fmt.Println("Remove folder: ", trashDir)
			os.RemoveAll(trashDir)
		}

	}
}
