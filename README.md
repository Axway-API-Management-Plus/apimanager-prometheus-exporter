# Prometheus Exporter
  
:warning This project is work in progress. However: Feedback, ideas, requirements are very welcome and of course of any kind of contribution.  

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
The goal is to execute the exporter as a Docker-Container and Java-Application. It can be executed either directly on the API-Manager host or on dedicated machines.  
For now, please clone the project and run the main Java-Class: `com.axway.apim.prometheus.ExporterMain` 

## Changelog
- 0.0.1 - 05.08.2019
  - initial version
  
## Limitations/Caveats
- No historical data can be imported into Prometheus


## Contributing

Please read [Contributing.md](https://github.com/Axway-API-Management-Plus/Common/blob/master/Contributing.md) for details on our code of conduct, and the process for submitting pull requests to us.  

## Team

![alt text][Axwaylogo] Axway Team

[Axwaylogo]: https://github.com/Axway-API-Management/Common/blob/master/img/AxwayLogoSmall.png  "Axway logo"


## License
[Apache License 2.0](/LICENSE)
