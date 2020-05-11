package main

import (
	"flag"
	"io/ioutil"
	"log"
	"os"
	"path"
	"path/filepath"
	"sync"
	"time"
)

const defaultThreshold time.Duration = 120 * time.Hour

func main() {
	var (
		threshold time.Duration
		trashPath string
		debug     bool
	)

	flag.DurationVar(&threshold, "threshold", defaultThreshold, "The minimum age of the items to be removed.")
	flag.StringVar(&trashPath, "path", "./.trash", "Specify the root path of the trash folder to be cleaned.")
	flag.BoolVar(&debug, "debug", false, "Set debug mode to get more detailed log of deleted files.")
	flag.Parse()
	log.Printf("Start cleaning with the following values: \n - threshold = %v \n - trashPath = %v", threshold, trashPath)

	loc, _ := time.LoadLocation("UTC")
	now := time.Now().In(loc)

	// Check if trashPath exist
	if _, err := os.Stat(trashPath); os.IsNotExist(err) {
		log.Fatalf("The folder to clean does not exist: %s", err)
	}

	// Get the list of files and folders within the trashPath to be removed because fit the threshold
	itemsToRemove := listToRemove(threshold, trashPath, now)

	// Iterate the list of items to remove to remove these recursively
	var wg sync.WaitGroup

	for _, v := range itemsToRemove {
		wg.Add(1)

		go removeTrashItem(&wg, v, debug)
	}

	wg.Wait()
}

func checkAgeThreshold(threshold time.Duration, now time.Time, fileAge time.Time) bool {
	diff := now.Sub(fileAge)

	return diff >= threshold
}

func listToRemove(threshold time.Duration, trashPath string, now time.Time) []string {
	var itemsToRemove []string

	trashItems, err := ioutil.ReadDir(trashPath)
	if err != nil {
		log.Fatalf("Problems listing files within trash folder: %v", err)
	}

	for _, trashItem := range trashItems {
		fileAge := trashItem.ModTime()

		if checkAgeThreshold(threshold, now, fileAge) {
			itemsToRemove = append(itemsToRemove, path.Join(trashPath, trashItem.Name()))
		}
	}

	return itemsToRemove
}

func removeTrashItem(wg *sync.WaitGroup, itemToRemove string, debug bool) {
	defer wg.Done()

	err := filepath.Walk(itemToRemove, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			log.Fatalf("Error calling list files to remove: %s", err)
		}
		if !info.IsDir() {
			os.Remove(info.Name())
			if debug {
				log.Printf("File deleted: %v \n", info.Name())
			}
		}
		return nil
	})
	if err != nil {
		log.Fatalf("Error calling list files to remove: %s", err)
	}

	if debug {
		log.Printf("Element deleted: %v", itemToRemove)
	}

	err = os.RemoveAll(itemToRemove)
	if err != nil {
		log.Fatalf("Error calling list files to remove: %s", err)
	}
}
