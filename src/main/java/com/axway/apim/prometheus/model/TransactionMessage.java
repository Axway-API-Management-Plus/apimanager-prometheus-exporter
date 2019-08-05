package com.axway.apim.prometheus.model;

public class TransactionMessage extends Message {
	
	private String time;
	
	private String path;
	
	private String protocol;
	
	private String protocolSrc;
	
	private String duration;
	
	private String status;
	
	private ServiceContext[] serviceContexts;
	
	private Object customMsgAtts;
	
	private Leg[] legs;

	public TransactionMessage() {
		super();
	}

	public String getTime() {
		return time;
	}

	public void setTime(String time) {
		this.time = time;
	}

	public String getPath() {
		return path;
	}

	public void setPath(String path) {
		this.path = path;
	}

	public String getProtocol() {
		return protocol;
	}

	public void setProtocol(String protocol) {
		this.protocol = protocol;
	}

	public String getProtocolSrc() {
		return protocolSrc;
	}

	public void setProtocolSrc(String protocolSrc) {
		this.protocolSrc = protocolSrc;
	}

	public String getDuration() {
		return duration;
	}

	public void setDuration(String duration) {
		this.duration = duration;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public ServiceContext[] getServiceContexts() {
		return serviceContexts;
	}

	public void setServiceContexts(ServiceContext[] serviceContexts) {
		this.serviceContexts = serviceContexts;
	}

	public Object getCustomMsgAtts() {
		return customMsgAtts;
	}

	public void setCustomMsgAtts(Object customMsgAtts) {
		this.customMsgAtts = customMsgAtts;
	}

	public Leg[] getLegs() {
		return legs;
	}

	public void setLegs(Leg[] legs) {
		this.legs = legs;
	}
}
