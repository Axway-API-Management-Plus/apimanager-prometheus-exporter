package com.axway.apim.prometheus.model;

public class HeaderMessage extends Message {
	
	private String logCreationTime;
	
	private String hostname;
	
	private String domainId;
	
	private String groupId;
	
	private String groupName;
	
	private String serviceId;
	
	private String serviceName;
	
	private String version;
	
	public HeaderMessage() {
		
	}

	public String getLogCreationTime() {
		return logCreationTime;
	}

	public void setLogCreationTime(String logCreationTime) {
		this.logCreationTime = logCreationTime;
	}

	public String getHostname() {
		return hostname;
	}

	public void setHostname(String hostname) {
		this.hostname = hostname;
	}

	public String getDomainId() {
		return domainId;
	}

	public void setDomainId(String domainId) {
		this.domainId = domainId;
	}

	public String getGroupId() {
		return groupId;
	}

	public void setGroupId(String groupId) {
		this.groupId = groupId;
	}

	public String getGroupName() {
		return groupName;
	}

	public void setGroupName(String groupName) {
		this.groupName = groupName;
	}

	public String getServiceId() {
		return serviceId;
	}

	public void setServiceId(String serviceId) {
		this.serviceId = serviceId;
	}

	public String getServiceName() {
		return serviceName;
	}

	public void setServiceName(String serviceName) {
		this.serviceName = serviceName;
	}

	public String getVersion() {
		return version;
	}

	public void setVersion(String version) {
		this.version = version;
	}
}
