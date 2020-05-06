package main

import (
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"testing"
	"time"
)

func TestCheckAgeThreshold(t *testing.T) {
	loc, _ := time.LoadLocation("UTC")
	now := time.Now().In(loc)

	fileAge := time.Now().Add(-48 * time.Hour)

	// Check that not list files newer than daysThreshold

	daysThreshold := 3
	if checkAgeThreshold(daysThreshold, now, fileAge) {
		t.Error("With this threshold this file should not be set as true.")
	}

	daysThreshold = 1
	if !checkAgeThreshold(daysThreshold, now, fileAge) {
		t.Error("With this threshold this file should be set as true.")
	}

}

func TestListToRemove(t *testing.T) {
	loc, _ := time.LoadLocation("UTC")
	now := time.Now().In(loc)
	trashPath := "./testdata"

	threshold := 2
	if len(listToRemove(threshold, trashPath, now)) != 0 {
		t.Error("The list of files to be removed does not match with expected.")
	}

	threshold = 0
	if len(listToRemove(threshold, trashPath, now)) != 6 {
		t.Error("The list of files to be removed does not match with expected.")
	}

}

func TestRemoveTrashItem(t *testing.T) {
	trashPath := "./testdata_tmp"
	cmd := exec.Command("cp", "-r", "testdata", "testdata_tmp")
	log.Printf("Copying testdata to test remove items")
	cmd.Run()
	itemToRemove := "./testdata_tmp/dir1"
	removeTrashItem(itemToRemove)
	itemsList, _ := ioutil.ReadDir(trashPath)

	if len(itemsList) != 5 {
		t.Error("The number of items removed differ from expected.")
	}

	os.RemoveAll(trashPath)
}
