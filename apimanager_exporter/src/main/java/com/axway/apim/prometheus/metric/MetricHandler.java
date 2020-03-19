package com.axway.apim.prometheus.metric;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.axway.apim.prometheus.model.Message;

@Slf4j
public abstract class MetricHandler {

	
	public abstract void process(Message msg);
	
	public boolean isBlackListed(Message msg) throws Exception {
		return false;
	}
}
