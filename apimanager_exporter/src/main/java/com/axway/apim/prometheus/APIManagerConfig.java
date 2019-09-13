package com.axway.apim.prometheus;

import java.util.HashMap;
import java.util.Map;

public class APIManagerConfig {
	String hostname;
	String port;
	
	String username;
	String password;
	

	public String getHostname() {
		return hostname;
	}
	public void setHostname(String hostname) {
		this.hostname = hostname;
	}
	public String getPort() {
		return port;
	}
	public void setPort(String port) {
		this.port = port;
	}
	public String getUsername() {
		return username;
	}
	public void setUsername(String username) {
		this.username = username;
	}
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	
	public Map<String, String> getParams() {
		Map<String, String> params = new HashMap<String, String>();
		params.put("hostname",	getHostname());
		params.put("host",	getHostname()); // This is the way CommandParameters expects it
		params.put("port",		getPort());
		params.put("username",	getUsername());
		params.put("password",	getPassword());
		return params;
	}
}
