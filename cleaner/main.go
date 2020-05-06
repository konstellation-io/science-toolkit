package main

import (
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"time"
)

var threshold int
var trashPath string
var debug bool

func main() {
	flag.IntVar(&threshold, "threshold", 5, "Specify the minimum age of the trash items to be removed.")
	flag.StringVar(&trashPath, "path", "./trash", "Specify the root path of the trash folder to be cleaned.")
	flag.BoolVar(&debug, "debug", false, "Set debug mode to get more detailed log of deleted files.")
	flag.Parse()
	log.Printf("Start cleaning with the following values: \n - threshold = %v \n - trashPath = %v", threshold, trashPath)

	loc, _ := time.LoadLocation("UTC")
	now := time.Now().In(loc)

	// Check if trasPath exist
	if _, err := os.Stat(trashPath); os.IsNotExist(err) {
		log.Fatalf("The folder to clean does not exist: %v", trashPath)
	}

	// Get the list of files and folders within the trashFolder to be removed because fit the threshold
	itemsToRemove := listToRemove(threshold, trashPath, now)

	// Iterate the list of items to remove to remove these recursively
	for _, v := range itemsToRemove {
		removeTrashItem(v)
	}
}

func checkAgeThreshold(threshold int, now time.Time, fileAge time.Time) bool {
	diff := now.Sub(fileAge)
	days := int(diff.Hours() / 24)

	if days >= threshold {
		return true
	}

	return false
}

func listToRemove(threshold int, trashPath string, now time.Time) []string {
	trashItems, err := ioutil.ReadDir(trashPath)
	var itemsToRemove []string
	if err != nil {
		log.Fatalf("Problems listing files within trash folder: %v", err)
	}
	for _, trashItem := range trashItems {

		fileAge := trashItem.ModTime()

		if checkAgeThreshold(threshold, now, fileAge) {
			itemsToRemove = append(itemsToRemove, fmt.Sprint(trashPath, "/", trashItem.Name()))
		}

	}
	return itemsToRemove
}

func removeTrashItem(itemToRemove string) {

	err := filepath.Walk(itemToRemove, func(path string, info os.FileInfo, err error) error {

		if !info.IsDir() {
			os.Remove(info.Name())
			if debug {
				log.Printf("File deleted: %v \n", info.Name())
			}
		}
		return nil
	})
	if err != nil {
		panic(err)
	}
	os.RemoveAll(itemToRemove)
	log.Printf("Element deleted: %v", itemToRemove)
}
