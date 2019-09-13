package com.axway.apim.prometheus.model;

public class Leg {
	private String uri;
	
	private String status;
	
	private String statustext;
	
	private String method;
	
	private String vhost;
	
	private String wafStatus;
	
	private String bytesSent;
	
	private String bytesReceived;
	
	private String remoteName;
	
	private String remoteAddr;
	
	private String localAddr;
	
	private String remotePort;
	
	private String localPort;
	
	private String sslsubject;
	
	private int leg;
	
	private String timestamp;
	
	private String duration;
	
	private String serviceName;
	
	private String subject;
	
	private String operation;
	
	private String type;
	
	private String finalStatus;

	public String getUri() {
		return uri;
	}

	public void setUri(String uri) {
		this.uri = uri;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getStatustext() {
		return statustext;
	}

	public void setStatustext(String statustext) {
		this.statustext = statustext;
	}

	public String getMethod() {
		return method;
	}

	public void setMethod(String method) {
		this.method = method;
	}

	public String getVhost() {
		return vhost;
	}

	public void setVhost(String vhost) {
		this.vhost = vhost;
	}

	public String getWafStatus() {
		return wafStatus;
	}

	public void setWafStatus(String wafStatus) {
		this.wafStatus = wafStatus;
	}

	public String getBytesSent() {
		return bytesSent;
	}

	public void setBytesSent(String bytesSent) {
		this.bytesSent = bytesSent;
	}

	public String getBytesReceived() {
		return bytesReceived;
	}

	public void setBytesReceived(String bytesReceived) {
		this.bytesReceived = bytesReceived;
	}

	public String getRemoteName() {
		return remoteName;
	}

	public void setRemoteName(String remoteName) {
		this.remoteName = remoteName;
	}

	public String getRemoteAddr() {
		return remoteAddr;
	}

	public void setRemoteAddr(String remoteAddr) {
		this.remoteAddr = remoteAddr;
	}

	public String getLocalAddr() {
		return localAddr;
	}

	public void setLocalAddr(String localAddr) {
		this.localAddr = localAddr;
	}

	public String getRemotePort() {
		return remotePort;
	}

	public void setRemotePort(String remotePort) {
		this.remotePort = remotePort;
	}

	public String getLocalPort() {
		return localPort;
	}

	public void setLocalPort(String localPort) {
		this.localPort = localPort;
	}

	public String getSslsubject() {
		return sslsubject;
	}

	public void setSslsubject(String sslsubject) {
		this.sslsubject = sslsubject;
	}

	public int getLeg() {
		return leg;
	}

	public void setLeg(int leg) {
		this.leg = leg;
	}

	public String getTimestamp() {
		return timestamp;
	}

	public void setTimestamp(String timestamp) {
		this.timestamp = timestamp;
	}

	public String getDuration() {
		return duration;
	}

	public void setDuration(String duration) {
		this.duration = duration;
	}

	public String getServiceName() {
		return serviceName;
	}

	public void setServiceName(String serviceName) {
		this.serviceName = serviceName;
	}

	public String getSubject() {
		return subject;
	}

	public void setSubject(String subject) {
		this.subject = subject;
	}

	public String getOperation() {
		return operation;
	}

	public void setOperation(String operation) {
		this.operation = operation;
	}

	public String getType() {
		return type;
	}

	public void setType(String type) {
		this.type = type;
	}

	public String getFinalStatus() {
		return finalStatus;
	}

	public void setFinalStatus(String finalStatus) {
		this.finalStatus = finalStatus;
	}

	@Override
	public String toString() {
		return "Leg [uri=" + uri + ", status=" + status + ", statustext=" + statustext + ", method=" + method
				+ ", bytesSent=" + bytesSent + ", bytesReceived=" + bytesReceived + ", remoteName=" + remoteName + "]";
	}
}
