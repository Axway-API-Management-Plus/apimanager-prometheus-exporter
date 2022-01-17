## Create a new Release

1. Merge develop to master branch
2. Switch to master branch
3. Set the version 
  - in helm/Chart.yaml
  - in apibuilder4prometheus/package.json
  - Update the README.me - Section: `helm install ` two times
4. Update the Changelog
5. On GitHub create a release with a tag using Semver schema (e.g. 1.1.0)
6. Merge master back to develop