const client = require('prom-client');
const { getRegistry } = require( './metricsRegistry' );
/**
 * Action method.
 *
 * @param {object} params - A map of all the parameters passed from the flow.
 * @param {object} options - The additional options provided from the flow
 *	 engine.
 * @param {object} options.pluginConfig - The service configuration for this
 *	 plugin from API Builder config.pluginConfig['api-builder-plugin-pluginName']
 * @param {object} options.logger - The API Builder logger which can be used
 *	 to log messages to the console. When run in unit-tests, the messages are
 *	 not logged.  If you wish to test logging, you will need to create a
 *	 mocked logger (e.g. using `simple-mock`) and override in
 *	 `MockRuntime.loadPlugin`.  For more information about the logger, see:
 *	 https://docs.axway.com/bundle/api-builder/page/docs/developer_guide/project/logging/index.html
 * @param {*} [options.pluginContext] - The data provided by passing the
 *	 context to `sdk.load(file, actions, { pluginContext })` in `getPlugin`
 *	 in `index.js`.
 * @return {*} The response value (resolves to "next" output, or if the method
 *	 does not define "next", the first defined output).
 */
 async function getMetrics(params, options) {
	const { returnMetrics } = params;
	const registry = await getRegistry();
	registry._metrics.up.set({  }, 1);
	if(returnMetrics) {
		return registry.metrics();
	} else {
		return registry;
	}
}

async function processSystemMetrics(params, options) {
	const { systemMetrics } = params;
	const { logger } = options;
	const registry = await getRegistry();
	const metrics = registry._metrics;
	if (!systemMetrics) {
		throw new Error('Missing required parameter systemMetrics');
	}
	for(metric of systemMetrics) {
		/**
		 * We use the average here because we get different numbers of data points depending on the ANM poll speed and, 
		 * of course, only one value can be stored in the prom registry at a time. 
		 * The more often polling is done (both API Builder --> ANM & Prom-Scraper --> API Builder) the more accurate the data will be.
		 */
		metrics.axway_apigateway_instance_disk_used_ratio	.set({ gatewayId: metric.gatewayId }, await _getAvg(metric.diskUsedPercent));
		metrics.axway_apigateway_instance_cpu_ratio			.set({ gatewayId: metric.gatewayId }, await _getAvg(metric.cpuUsedMax));
		metrics.axway_apigateway_system_cpu_ratio			.set({ gatewayId: metric.gatewayId }, await _getAvg(metric.systemCpuMax));
		metrics.axway_apigateway_memory_used_bytes			.set({ gatewayId: metric.gatewayId }, await _getAvg(metric.memoryUsedMax)*1000);
		metrics.axway_apigateway_system_memory_total_bytes	.set({ gatewayId: metric.gatewayId }, await _getAvg(metric.systemMemoryTotal)*1000);
		metrics.axway_apigateway_system_memory_used_bytes	.set({ gatewayId: metric.gatewayId }, await _getAvg(metric.systemMemoryUsed)*1000);
	}
	return registry;
}

async function processTopologyInfo(params, options) {
	const { gatewayTopology } = params;
	const { logger } = options;
	const registry = await getRegistry();
	const metrics = registry._metrics;
	if (!gatewayTopology) {
		throw new Error('Missing required parameter gatewayTopology');
	}

	// Reset as previously added API-Gateway might have stopped/removed from the topology
	metrics.axway_apigateway_version_info.reset();

	for(service of gatewayTopology.services) {
		metrics.axway_apigateway_version_info		.set({ gatewayId: service.id, version: service.tags.productVersion, image: service.tags.image }, service.status == "down" ? 0 : 1);
	}
	return registry;
}

async function processServiceMetrics(params, options) {
	const { serviceMetrics } = params;
	const { logger } = options;
	var cache = options.pluginContext.cache;
	const registry = await getRegistry();
	const metrics = registry._metrics;
	if (!serviceMetrics) {
		throw new Error('Missing required parameter serviceMetrics');
	}

	logger.info(`Processing: ${serviceMetrics.length} service metrics.`);
	for(metric of serviceMetrics) {
		logger.info(`Processing service metrics for service: '${metric.name}' on gateway: ${metric.gatewayId}`);
		metrics.axway_api_requests_total		.inc({ gatewayId: metric.gatewayId, service: metric.name }, await _getSum(metric.numMessages) );
		metrics.axway_api_requests_success		.inc({ gatewayId: metric.gatewayId, service: metric.name }, await _getSum(metric.successes) );
		metrics.axway_api_requests_failures		.inc({ gatewayId: metric.gatewayId, service: metric.name }, await _getSum(metric.failures) );
		metrics.axway_api_requests_exceptions	.inc({ gatewayId: metric.gatewayId, service: metric.name }, await _getSum(metric.exceptions));
		// For all given processing times 
		var avgProcessed = false;
		for(processingTime of metric.processingTimeAvg) {
			// Ignore processingTime 0, as it means, no API-Request has been processed and with that is doesn't affect the average
			if(processingTime ==  0) continue;
			// Convert given milliseconds into prometheus base unit seconds
			processingTime = processingTime/1000;
			logger.info(`Adding ProcessingTimeAvg ${processingTime} for service: ${metric.name} on gatewayId: ${metric.gatewayId}`);
			metrics.axway_api_requests_duration_seconds.observe({ gatewayId: metric.gatewayId, service: metric.name }, processingTime);
			avgProcessed = true;
		}
		if(avgProcessed == false) {
			logger.warn(`Ignore processing time datapoints: ${JSON.stringify(metric.processingTimeAvg)} for API: ${metric.name} on gatewayId: ${metric.gatewayId} as the API very likely wasn't called.`);
		}
	}
	return registry;
}

async function _getSum(array) {
	if(array) {
		return array.reduce(function(a, b) {return a + b; }, 0) 
	} else {
		return 0;
	}
}

async function _getAvg(array) {
	if(array) {
		return Math.round(array.reduce((a,b) => a + b, 0) / array.length);
	} else {
		return 0;
	}
}

module.exports = {
	processServiceMetrics,
	processSystemMetrics,
	processTopologyInfo,
	getMetrics
};
