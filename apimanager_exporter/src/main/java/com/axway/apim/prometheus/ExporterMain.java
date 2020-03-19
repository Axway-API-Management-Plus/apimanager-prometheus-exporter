package com.axway.apim.prometheus;

import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.component.lumberjack.LumberjackComponent;
import org.apache.camel.impl.DefaultCamelContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.axway.apim.lib.CommandParameters;
import com.axway.apim.prometheus.apiregistry.APIRegistry;

import io.prometheus.client.exporter.HTTPServer;

public class ExporterMain {

	public static void main(String[] args) throws Exception {
		

		String configPath = args.length > 0 ? args[0] : Config.DEFAULT_PATH;
		Config cfg = Config.getConfigFromFile(configPath);

		APIManagerConfig mgrCfg = cfg.getApimanager();
		
		new CommandParameters(mgrCfg.getParams());
		
		DefaultCamelContext context = new DefaultCamelContext();
		LumberjackComponent lumberjack = new LumberjackComponent();
		MessageProcessor processor = new MessageProcessor();
		
		Logger LOG = LoggerFactory.getLogger(ExporterMain.class);
		
		new APIRegistry();

		RouteBuilder builder = new RouteBuilder() {
			public void configure() {
				from("lumberjack:0.0.0.0")
				.process(processor);                   
			}
		};
		context.addRoutes(builder);
		context.addComponent("lumberjack", lumberjack);
		context.start();

		new HTTPServer(cfg.getListenAddress(), cfg.getListenPort());
		LOG.info("API-Manager prometheus exporter successfully started. "
				+ "Version: {}" , ExporterMain.class.getPackage().getImplementationVersion());

		for (; ; ) {
			try {
				//scrapper.run(true);
			} catch (Exception e) {
				LOG.error("Scrapper stopped due to uncaught exception", e);
			}

			try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				System.exit(0);
			}
		}

	}

}
