package main

import (
	"io/ioutil"
	"os"
	"sync"
	"testing"
	"time"

	"log"
)

func TestCheckAgeThreshold(t *testing.T) {
	loc, _ := time.LoadLocation("UTC")
	now := time.Now().In(loc)

	fileAge := time.Now().Add(-48 * time.Hour)

	// Check that not list files newer than daysThreshold

	var daysThreshold time.Duration = 72 * time.Hour
	if checkAgeThreshold(daysThreshold, now, fileAge) {
		t.Error("With this threshold this file should not be set as true.")
	}

	daysThreshold = 24 * time.Hour
	if !checkAgeThreshold(daysThreshold, now, fileAge) {
		t.Error("With this threshold this file should be set as true.")
	}
}

func TestListToRemove(t *testing.T) {
	loc, _ := time.LoadLocation("UTC")
	now := time.Now().In(loc)
	trashPath := "./testdata"

	threshold := 48 * time.Hour
	if len(listToRemove(threshold, trashPath, now)) != 0 {
		t.Error("The list of files to be removed does not match with expected.")
	}

	threshold = 0 * time.Hour
	if len(listToRemove(threshold, trashPath, now)) != 6 {
		t.Error("The list of files to be removed does not match with expected.")
	}
}

func TestRemoveTrashItem(t *testing.T) {
	trashPath := "./testdata_tmp"
	dirs := createTestFolder(t, trashPath)
	dir := dirs[0]

	defer os.RemoveAll(trashPath)

	var wg sync.WaitGroup

	wg.Add(1)

	go removeTrashItem(&wg, dir, false)
	wg.Wait()

	itemsList, _ := ioutil.ReadDir(trashPath)

	if len(itemsList) != 3 {
		t.Error("The number of items removed differ from expected.")
	}
}

func createTestFolder(t *testing.T, trashPath string) []string {
	t.Helper()

	err := os.Mkdir(trashPath, 0777)
	if err != nil {
		t.Fatalf("Error creating testFolder: %s", err)
	}

	var tmpDir []string

	for i := 0; i < 4; i++ {
		dir, err := ioutil.TempDir(trashPath, "*")
		if err != nil {
			log.Printf("Can not create temp dir")
		}

		_, err = ioutil.TempFile(dir, "data_set_*")
		if err != nil {
			t.Fatal(err)
		}

		tmpDir = append(tmpDir, dir)
	}

	return tmpDir
}
