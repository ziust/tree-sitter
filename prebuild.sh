#!/bin/bash

set -e

targets="-t 18.0.0 -t 20.0.0 -t 22.0.0 -t 23.0.0"

platforms=(
    "linux"
    "darwin"
    "win32"
)

archs=(
    "x64"
    "arm64"
)

for platform in "${platforms[@]}"; do
    for arch in "${archs[@]}"; do
        npx prebuildify $targets --platform "$platform" --arch "$arch" --napi
    done
done
