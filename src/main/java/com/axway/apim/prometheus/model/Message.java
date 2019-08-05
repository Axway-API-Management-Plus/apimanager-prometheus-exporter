package com.axway.apim.prometheus.model;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class Message {
	
	static Logger LOG = LoggerFactory.getLogger(Message.class);

	private String type;
	
	Message() {
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}
}
