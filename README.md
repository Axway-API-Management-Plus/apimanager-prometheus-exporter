# Prometheus Exporter
  
:warning: This project is work in progress on a PoC/Prototype stage.  

However: Feedback, ideas, requirements are very welcome and of course of any kind of contribution.  

This project allows you to export API-Management metrics as OpenMetrics for Prometheus and make them consumable for instance in Grafana dashboards.   
For that purpose it acts like a proxy between the API-Manager hosts, consumes & parses generated Metrics and exposes them on an HTTP-Endpoint as in this [example](https://raw.githubusercontent.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/master/misc/documentation/exposed-metrics-sample.txt).   
In Prometheus each exporter is configured as a target, automatically scraped and exposed metrics are stored into the Prometheush time-series-database. 

This illustration provides a basic overview about the workflow:  
![APIManager-Prometheus Exporter overview]( https://github.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/blob/master/misc/images/apimanager-prometheus-exporter-overview.png )

The Prometheus-Exporter is driven based on the generated Metrics-Information (/events), which will be streamed by Filebeat to the 
exporter. The received messages are parsed, potentially blacklisted and and exposed as OpenMetrics.  

Based on the collected data Dashboard like this example can be created:
![Grafana Dashboard]( https://github.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/blob/master/misc/images/apimanager-prometheus-exporter-sample-grafana-dashboard.png )

## Install

The goal of the solution is to run the Axway API-Management Prometheus exporter as a Docker container. A Helm-Chart is provided for installation into a Kubernetes cluster. We recommend creating a `values.local.yaml` to be able to version their configuration accordingly. Please check the base [values.yaml](https://github.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/blob/master/helm/values.yaml) for more documentation about individidual parameters.  

You can find an example here: [example.local.values.yaml](https://raw.githubusercontent.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/master/helm/examples/example.local.values.yaml)

To install the Helm-Chart:  
```
wget -O local.values.yaml https://raw.githubusercontent.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/master/helm/examples/example.local.values.yaml
helm install -n <your-namespace> <name> -f <path-to-you-local-values> https://github.com/Axway-API-Management-Plus/apimanager-prometheus-exporter/releases/download/v0.1.0/helm-chart-axway-apim-prometheus-v0.1.0.tgz
```

## Contributing

Please read [Contributing.md](https://github.com/Axway-API-Management-Plus/Common/blob/master/Contributing.md) for details on our code of conduct, and the process for submitting pull requests to us.  

## Team

![alt text][Axwaylogo] Axway Team

[Axwaylogo]: https://github.com/Axway-API-Management/Common/blob/master/img/AxwayLogoSmall.png  "Axway logo"


## License
[Apache License 2.0](/LICENSE)
