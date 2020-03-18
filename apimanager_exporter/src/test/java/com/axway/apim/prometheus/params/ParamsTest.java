package com.axway.apim.prometheus.params;

import java.util.Map;

import org.testng.Assert;
import org.testng.annotations.Test;

import com.axway.apim.prometheus.APIManagerConfig;
import com.axway.apim.prometheus.Config;

public class ParamsTest {
  @Test
  public void checkDefaultParams() throws Exception {
	  String configToTest = this.getClass().getResource("/config.yml").getFile();
	  Config cfg = Config.getConfigFromFile(configToTest);
	  APIManagerConfig mgrCfg = cfg.getApimanager();
	  
	  Assert.assertEquals(mgrCfg.getHostname(), "api-env");
	  Assert.assertEquals(mgrCfg.getPort(), "8075");
	  Assert.assertEquals(mgrCfg.getUsername(), "apiadmin");
	  Assert.assertEquals(mgrCfg.getPassword(), "changeme");
	  
	  Map<String, String> params = mgrCfg.getParams();
	  Assert.assertEquals(params.get("hostname"), "api-env");
	  Assert.assertEquals(params.get("port"), "8075");
	  Assert.assertEquals(params.get("password"), "changeme");
	  Assert.assertEquals(params.get("username"), "apiadmin");
  }
}
