# Prometheus Exporter

This project provides a Prometheus exporter for the Axway API-Management solution based on the metrics provided by the Admin Node Manager (ANM). The Prometheus Exporter retrieves the metrics provided by the ANM at a configurable interval, converts them into format necessary for the Prometheus scraper, and makes them available on an HTTP endpoint. Here you can see an [example](https://raw.githubusercontent.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/master/misc/documentation/exposed-metrics-sample.txt).

The Prometheus exporter is made available as a Docker image based on the Axway API builder, a Node.js application, and ideally runs in a container platform as a microservice. Alternatively, you can also run the container using Docker.

This illustration provides a basic overview about the workflow:  
![APIManager-Prometheus Exporter overview]( https://github.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/blob/master/misc/images/apimanager-prometheus-exporter-overview.png )

## Installation

### Container-Platform

The goal of the solution is to run the Axway API-Management Prometheus exporter as a Docker container. A Helm-Chart is provided for installation into a Kubernetes cluster. We recommend creating a `values.local.yaml` to be able to version their configuration accordingly. Please check the base [values.yaml](https://github.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/blob/master/helm/values.yaml) for more documentation about individidual parameters.  

You can find an example here: [example.local.values.yaml](https://raw.githubusercontent.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/master/helm/examples/example.local.values.yaml)

To install the Helm-Chart:  
```
wget -O local.values.yaml https://raw.githubusercontent.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/master/helm/examples/example.local.values.yaml
helm install -n <your-namespace> <name> -f <path-to-you-local-values> https://github.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/releases/download/0.3.0/helm-chart-axway-apim-prometheus-0.4.0.tgz
```

### Docker

Alternatively, you can launch the Prometheus Exporter as a Docker container using Docker. Use the following command to create a new container with the appropriate environment variables and start it.

```
docker run -d --name axway-prom-exporter -e ANM_URL='https://anm:8090' -e 'ANM_USERNAME=admin' -e 'ANM_PASSWORD=mypassword' cwiechmann/apibuilder4prometheus
```

You can also use an environment file to configure the necessary environment variables. 


```
docker run -d --name axway-prom-exporter --env-file ./prom-env cwiechmann/apibuilder4prometheus
```

To stop and start the container use:

```
docker stop axway-prom-exporter
docker start axway-prom-exporter
```

## Configuration

The Prometheus Exporter is configured using environment variables, which are explained below.

| Variable                      | Example                                            | Comment                               |
| :---                          | :---                                               | :---                                  |
| ANM_URL                       | https://anm.host.com    | URL of the admin node manager incl. port. Hostname must be resolvable in the running Docker container.| 
| ANM_USERNAME                  | prom-user               | User for communication with the ANM. Must have rights to read the monitoring information. | 
| ANM_PASSWORD                  | prom-user-password      | Password of the Admin-Node-Manager user | 
| LOG_LEVEL                     | debug                   | Debug level of the Prometheus-Exporter application. Defaults to info. Don't set debug in production. | 
| POLL_SERVICE_METRICS_INTERVAL | 30000                   | How often should Service-Metrics (i.e. APIs-Requests, Duration) be fetched from the ANM. The shorter the interval, the more granular the metrics, but possibly more load on the ANM. Defaults to 15000 (15 seconds) | 
| POLL_SYSTEM_METRICS_INTERVAL  | 30000                   | How often should System-Metrics (i.e. CPU-, Disk-Usage, ...) be fetched from the ANM. The shorter the interval, the more granular the metrics, but possibly more load on the ANM. Defaults to 15000 (15 seconds) | 


## Contributing

Please read [Contributing.md](https://github.com/Axway-API-Management-Plus/Common/blob/master/Contributing.md) for details on our code of conduct, and the process for submitting pull requests to us.  

## Team

![alt text][Axwaylogo] Axway Team

[Axwaylogo]: https://github.com/Axway-API-Management/Common/blob/master/img/AxwayLogoSmall.png  "Axway logo"


## License
[Apache License 2.0](/LICENSE)
