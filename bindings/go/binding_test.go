package tree_sitter_ziust_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_ziust "github.com/ziust/tree-sitter.git/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_ziust.Language())
	if language == nil {
		t.Errorf("Error loading Ziust grammar")
	}
}
