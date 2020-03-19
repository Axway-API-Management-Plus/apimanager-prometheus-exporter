package com.axway.apim.prometheus.metric;

import static java.util.stream.Collectors.toList;

import java.util.List;
import java.util.regex.Pattern;

import com.axway.apim.prometheus.Config;
import com.axway.apim.prometheus.model.Leg;
import com.axway.apim.prometheus.model.Message;
import com.axway.apim.prometheus.model.ServiceContext;
import com.axway.apim.prometheus.model.TransactionMessage;

import io.prometheus.client.Counter;
import io.prometheus.client.Histogram;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class TransactionMetricHandler extends MetricHandler {
	
	private List<Pattern> blackLists = null;
	
	private final Counter totalAPIRequests = Counter.build()
	        .name("api_requests_total")
	        .labelNames("service", "path", "code", "app")
	        .help("The total number of API-Requests")
	        .register();
	
	private final Histogram apiRequestDuration = Histogram.build()
	        .name("api_request_duration_seconds")
	        .labelNames("service", "path", "code", "app")
	        .help("End to End processing time for an API-Call")
	        .register();
	
	private final Histogram downstreamServiceResponseTime = Histogram.build()
	        .name("api_downstream_server_response_time")
	        .labelNames("remoteName", "remoteAddr", "remotePort")
	        .help("Processing time")
	        .register();	

	public TransactionMetricHandler() {
		super();
	}

	@Override
	public void process(Message msg) {
		log.info("Processing transaction");
		TransactionMessage transaction = (TransactionMessage)msg;
		
		totalAPIRequests.labels(
				getServiceContext(transaction).getService(), 
				transaction.getPath(), 
				transaction.getLegs()[0].getStatus(), 
				getApplication(transaction))
		.setTimestampMs(new Long(transaction.getTime()))
		.inc();

		extractDownstreamServerPerformance(transaction);
		apiRequestDuration.labels(
				getServiceContext(transaction).getService(), 
				transaction.getPath(), 
				transaction.getLegs()[0].getStatus(), 
				getApplication(transaction)
				)
		.setTimestampMs(new Long(transaction.getTime()))
		.observe(new Double(transaction.getDuration())/1000);
	}
	
	private ServiceContext getServiceContext(TransactionMessage transaction) {
		if(transaction.getServiceContexts()!=null && transaction.getServiceContexts().length!=0) {
			return transaction.getServiceContexts()[0];
		} else {
			ServiceContext serviceContext = new ServiceContext();
			serviceContext.setService("Unknown API");
			return serviceContext;
		}
	}
	
	private String getApplication(TransactionMessage transaction) {
		if(transaction.getServiceContexts()!=null && transaction.getServiceContexts().length!=0) {
			String app = transaction.getServiceContexts()[0].getApp();
			if(app==null) return "Unknown Application";
			if(app.startsWith("Wearable")) return "Wearable Activity Tracker";
			return app;
		} else {
			return "Unknown Application";
		}
	}
	
	private String getMethod(TransactionMessage transaction) {
		if(transaction.getLegs()!=null && transaction.getLegs().length!=0) {
			return transaction.getLegs()[0].getMethod();
		}
		return "N/A";
	}
	
	private void extractDownstreamServerPerformance(TransactionMessage transaction) {
		// When having only 1 leg it means there was no communication with a Downstream server
		if(transaction.getLegs()==null || transaction.getLegs().length==0 || transaction.getLegs().length==1) return;
		for(int i=1; i<transaction.getLegs().length; i++) {
			Leg leg = transaction.getLegs()[i];
			downstreamServiceResponseTime.labels(
					leg.getRemoteName(), 
					leg.getRemoteAddr(), 
					leg.getRemotePort())
			.setTimestampMs(new Long(transaction.getTime()))
			.observe(new Double(leg.getDuration())/1000);
		}
	}

	@Override
	public boolean isBlackListed(Message msg) throws Exception {
		if(blackLists == null)
		try {
			List<String> blackListConfig = Config.getInstance().getBlacklist();
			blackLists = blackListConfig.stream().map(Pattern::compile).collect(toList());
		} catch (Exception e) {
			throw new Exception("Unable to parse blacklist patterns.", e);
		}
		TransactionMessage transaction = (TransactionMessage)msg;
		String checkString = transaction.getProtocolSrc()+":"+getMethod(transaction)+":"+transaction.getPath();
		for(Pattern p : blackLists) {
			if(p.matcher(checkString).matches()) {
				log.debug("Transaction: '{}' is blacklisted based on configred RegEx: '{}'",checkString,p.toString());
				return true;
			}
		}
		return false;
	}
}
