package com.axway.apim.prometheus;

import org.apache.camel.builder.RouteBuilder;
import org.apache.camel.component.lumberjack.LumberjackComponent;
import org.apache.camel.impl.DefaultCamelContext;
import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.axway.apim.lib.CommandParameters;
import com.axway.apim.prometheus.apiregistry.APIRegistry;

import io.prometheus.client.exporter.HTTPServer;

public class ExporterMain {

	public static void main(String[] args) throws Exception {
		Logger logger = LoggerFactory.getLogger(ExporterMain.class);

		String configPath = args.length > 0 ? args[0] : Config.DEFAULT_PATH;
		Config cfg = Config.getConfigFromFile(configPath);


		
		APIManagerConfig mgrCfg = cfg.getAPIManager();
		
		String[] apiManagerArgs = {"-host", mgrCfg.getHostname(), "-username", mgrCfg.getUsername(), "-password", mgrCfg.getPassword()};

		Options options = new Options();
		Option option;
		
		option = new Option("h", "host", true, "The API-Manager hostname the API should be imported");
		option.setRequired(false);
		option.setArgName("api-host");
		options.addOption(option);

		option = new Option("port", true, "Optional parameter to declare the API-Manager port. Defaults to 8075.");
		option.setArgName("8181");
		options.addOption(option);

		option = new Option("u", "username", true, "Username used to authenticate. Please note, that this user must have Admin-Role");
		option.setRequired(false);
		option.setArgName("apiadmin");
		options.addOption(option);

		option = new Option("p", "password", true, "Password used to authenticate");
		option.setRequired(false);
		option.setArgName("changeme");
		options.addOption(option);
		
		CommandLineParser parser = new DefaultParser();
		
		CommandLine cmd = null;
		
		try {
			cmd = parser.parse(options, apiManagerArgs);
		} catch (ParseException e) {
			System.exit(99);
		}
		
		new CommandParameters(cmd);
		
		DefaultCamelContext context = new DefaultCamelContext();
		LumberjackComponent lumberjack = new LumberjackComponent();
		MessageProcessor processor = new MessageProcessor();
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

		HTTPServer server = new HTTPServer(cfg.getListenAddress(), cfg.getListenPort());

		for (; ; ) {
			try {
				//scrapper.run(true);
			} catch (Exception e) {
				logger.error("Scrapper stopped due to uncaught exception", e);
			}

			try {
				Thread.sleep(1000);
			} catch (InterruptedException e) {
				System.exit(0);
			}
		}

	}

}
