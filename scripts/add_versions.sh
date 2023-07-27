#!/bin/bash
set -ex

PACKAGE_NAME=$(cat package.json | jq -r '.name')
PUBLISH_VERSION=$(cat package.json | jq -r '.version')

npm dist-tag add "$PACKAGE_NAME@$PUBLISH_VERSION" buildnet
# npm dist-tag rm "$PACKAGE_NAME@0.0.1" testnet
