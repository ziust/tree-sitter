#!/bin/sh

set -e

npx tree-sitter generate
npx tree-sitter build --wasm
npx tree-sitter playground
