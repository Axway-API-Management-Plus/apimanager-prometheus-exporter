.SILENT :
.PHONY : help volume mount update build clean cleanup start debug shell test install docker do done echo package

USERNAME:=jleroy

# Default Docker run command for shell access
SHELL_CMD?=-c /bin/bash

# Docker configuartion regarding the system architecture
DOCKER=docker
DOCKERFILE=Dockerfile
CURRENT_DIR=$(shell pwd)
IMAGE=docker-registry.demo.axway.com/other-demo/axway-to-prometheus:latest
HOSTNAME=localhost

all: help

## This help screen
help:
	printf "Available targets:\n\n"
	awk '/^[a-zA-Z\-\_0-9]+:/ { \
		helpMessage = match(lastLine, /^## (.*)/); \
		if (helpMessage) { \
			helpCommand = substr($$1, 0, index($$1, ":")); \
			helpMessage = substr(lastLine, RSTART + 3, RLENGTH); \
			printf "%-15s %s\n", helpCommand, helpMessage; \
		} \
	} \
	{ lastLine = $$0 }' $(MAKEFILE_LIST)


## Run docker image
run:
	docker run --name apim-to-prometheus -p 5044:5044 -v ${CURRENT_DIR}/apimanager_exporter/src/main/resources/config.yml:/opt/config.yml  docker-registry.demo.axway.com/other-demo/axway-to-prometheus:latest

## Stop docker image
stop:
	docker rm -f apim-to-prometheus

## Compile and package fat-jar
package:
	mvn clean package -pl apimanager_exporter -am -Pfat-jar

## Build docker image
build_docker:
	${DOCKER}  build -t ${IMAGE} apimanager_exporter/


## Build fat-jar and docker image
build:
	make package
	make build_docker

