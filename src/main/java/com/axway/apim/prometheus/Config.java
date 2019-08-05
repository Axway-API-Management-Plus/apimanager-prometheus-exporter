package com.axway.apim.prometheus;

import java.io.File;
import java.util.Collections;
import java.util.List;
import java.util.SortedMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;

public final class Config {
	
	private static Logger LOG = LoggerFactory.getLogger(Config.class);
	
	private static Config instance = null;

    public static final String DEFAULT_PATH = "config.yml";
    private String host;
    private List<String> blacklist;
    private boolean ssl;
    private int listenPort;
    private String listenAddress = "0.0.0.0";
    private SortedMap<Integer, List<String>> maxScrapFrequencyInSec;
    
    private APIManagerConfig apimanager;
    
    public static Config getInstance() throws Exception {
    	if(instance == null) {
    		LOG.error("Config has not been initialized");
    		throw new Exception("Config has not been initialized");
    	}
    	return instance;
    }

    public static Config getConfigFromFile(String filePath) throws Exception {
        
        LOG.info("Loading yaml config from {}", filePath);

        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        try {
            Config cfg = mapper.readValue(new File(filePath), Config.class);
            LOG.trace(cfg.toString());
            instance = cfg;
        } catch (Exception e) {
            LOG.error("Cannot load config file", e);
            throw e;
        }
        return instance;
    }

    public SortedMap<Integer, List<String>> getMaxScrapFrequencyInSec() {
        return maxScrapFrequencyInSec;
    }

    public String getListenAddress() {
        return listenAddress;
    }

    public int getListenPort() {
        return listenPort;
    }

    public String getHost() {
        return host;
    }

    public List<String> getBlacklist() {
        return blacklist == null ? Collections.emptyList() : blacklist;
    }

    public boolean getSSL() {
        return ssl;
    }
    
    public APIManagerConfig getAPIManager() {
        return apimanager;
    }    
}

