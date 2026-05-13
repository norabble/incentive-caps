#!/usr/bin/env bash
set -euo pipefail

BUMP=${1:-patch}

if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
  echo "Usage: npm run publish:release -- [patch|minor|major]"
  echo "Defaults to 'patch' if omitted."
  exit 1
fi

# Require clean working tree
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: working tree is not clean. Commit or stash changes before publishing."
  exit 1
fi

# Bump version, commit, and tag
npm version "$BUMP" --no-git-tag-version
VERSION=$(node -p "require('./package.json').version")
git add package.json package-lock.json
git commit -m "release v$VERSION"
git tag "v$VERSION"

# Push commit and tag — GitHub Actions will build and create the release
git push -u origin HEAD
git push origin "v$VERSION"

echo ""
echo "Pushed v$VERSION. GitHub Actions will build and publish the release."
