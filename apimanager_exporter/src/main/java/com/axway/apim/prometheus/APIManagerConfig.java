package com.axway.apim.prometheus;

import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
public class APIManagerConfig {
	String hostname;
	String port;
	
	String username;
	String password;

	
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
