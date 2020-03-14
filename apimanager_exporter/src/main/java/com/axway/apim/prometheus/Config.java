package com.axway.apim.prometheus;

import java.io.File;
import java.util.Collections;
import java.util.List;
import java.util.SortedMap;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.dataformat.yaml.YAMLFactory;
@Slf4j
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public final class Config {

	
	private static Config instance = null;

    public static final String DEFAULT_PATH = "config.yml";
    private List<String> blacklist;
    private boolean ssl;
    private int listenPort;
    private String listenAddress = "0.0.0.0";
    private SortedMap<Integer, List<String>> maxScrapFrequencyInSec;
    
    private APIManagerConfig apimanager;
    
    public static Config getInstance() throws Exception {
    	if(instance == null) {
    		log.error("Config has not been initialized");
    		throw new Exception("Config has not been initialized");
    	}
    	return instance;
    }

    public static Config getConfigFromFile(String filePath) throws Exception {
        File configFile = new File(filePath);
        if(!configFile.exists()) {
        	if(Config.class.getResource("/"+filePath)!=null) {
        		configFile = new File(Config.class.getResource("/"+filePath).getFile());
        	} else {
        		log.error("Config file: '{}' not found.",filePath);
        		throw new RuntimeException("Config file: '"+filePath+"' not found.");
        	}
        }
        log.info("Loading config from '{}'", configFile);

        ObjectMapper mapper = new ObjectMapper(new YAMLFactory());
        try {
            Config cfg = mapper.readValue(configFile, Config.class);
            log.trace(cfg.toString());
            instance = cfg;
        } catch (Exception e) {
            log.error("Cannot load config file", e);
            throw e;
        }
        return instance;
    }

}

