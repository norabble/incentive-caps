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

# Require gh CLI
if ! command -v gh &>/dev/null; then
  echo "Error: gh CLI not found. Install it from https://cli.github.com"
  exit 1
fi

# Bump version (creates a git commit + tag)
npm version "$BUMP" --no-git-tag-version
VERSION=$(node -p "require('./package.json').version")
git add package.json package-lock.json
git commit -m "release v$VERSION"
git tag "v$VERSION"

# Build single-file artifact
npm run build:single

ARTIFACT="dist/incentive-caps-v${VERSION}.html"
cp dist/index.html "$ARTIFACT"

# Push commit and tag, then create GitHub Release
git push -u origin HEAD
git push origin "v$VERSION"

gh release create "v$VERSION" \
  --title "v$VERSION" \
  --notes "Single-file build of incentive-caps v${VERSION}." \
  "$ARTIFACT#incentive-caps-v${VERSION}.html"

echo ""
echo "Published v$VERSION to GitHub Releases."
