package com.axway.apim.prometheus.metric;

import com.axway.apim.prometheus.model.HeaderMessage;
import com.axway.apim.prometheus.model.Message;

import io.prometheus.client.Gauge;

public class HeaderMetricHandler extends MetricHandler {
	
	private final Gauge apiGatewayVersion = Gauge.build()
	        .name("api_manager_info")
	        .labelNames("version", "hostname", "groupId", "groupName", "serviceId", "serviceName")
	        .help("The detected API-Manager version")
	        .register();
	


	public HeaderMetricHandler() {
		super();
	}

	@Override
	public void process(Message msg) {
		HeaderMessage header = (HeaderMessage)msg;
		apiGatewayVersion.labels(
				header.getVersion(), 
				header.getHostname(), 
				header.getGroupId(), 
				header.getGroupName(), 
				header.getServiceId(), 
				header.getServiceName()
		);
	}
}
