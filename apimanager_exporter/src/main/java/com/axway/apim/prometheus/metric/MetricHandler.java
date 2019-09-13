package com.axway.apim.prometheus.metric;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.axway.apim.prometheus.model.Message;

public abstract class MetricHandler {
	static Logger LOG = LoggerFactory.getLogger(MetricHandler.class);
	
	public abstract void process(Message msg);
	
	public boolean isBlackListed(Message msg) throws Exception {
		return false;
	}
}
