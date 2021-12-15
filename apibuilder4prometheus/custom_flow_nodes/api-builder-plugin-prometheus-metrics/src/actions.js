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

async function processSummaryMetrics(params, options) {
	const { summaryMetrics } = params;
	const { logger } = options;
	const registry = await getRegistry();
	const metrics = registry._metrics;
	if (!summaryMetrics) {
		throw new Error('Missing required parameter summaryMetrics');
	}

	for(metric of summaryMetrics) {
		metrics.axway_apigateway_instance_disk_used		.set({ gatewayId: metric.gatewayId }, metric.diskUsedPercent);
		metrics.axway_apigateway_instance_cpu			.set({ gatewayId: metric.gatewayId }, metric.cpuUsed);
		metrics.axway_apigateway_instance_cpu_avg		.set({ gatewayId: metric.gatewayId }, metric.cpuUsedAvg);
		metrics.axway_apigateway_instance_cpu_min		.set({ gatewayId: metric.gatewayId }, metric.cpuUsedMin);
		metrics.axway_apigateway_instance_cpu_max		.set({ gatewayId: metric.gatewayId }, metric.cpuUsedMax);
		metrics.axway_apigateway_system_cpu_avg			.set({ gatewayId: metric.gatewayId }, metric.systemCpuAvg);
		metrics.axway_apigateway_system_cpu_min			.set({ gatewayId: metric.gatewayId }, metric.systemCpuMin);
		metrics.axway_apigateway_system_cpu_max			.set({ gatewayId: metric.gatewayId }, metric.systemCpuMax);
		metrics.axway_apigateway_instance_memory_min		.set({ gatewayId: metric.gatewayId }, metric.memoryUsedMin);
		metrics.axway_apigateway_instance_memory_max		.set({ gatewayId: metric.gatewayId }, metric.memoryUsedMax);
		metrics.axway_apigateway_instance_memory_avg		.set({ gatewayId: metric.gatewayId }, metric.memoryUsedAvg);
		metrics.axway_apigateway_system_memory			.set({ gatewayId: metric.gatewayId }, metric.systemMemoryUsed);
		metrics.axway_apigateway_system_memory_total		.set({ gatewayId: metric.gatewayId }, metric.systemMemoryTotal);
	}
	return registry;
}

async function processTopologyInfo(params, options) {
	const { gatewayTopology } = params;
	const { logger } = options;
	debugger;
	const registry = await getRegistry();
	const metrics = registry._metrics;
	if (!gatewayTopology) {
		throw new Error('Missing required parameter gatewayTopology');
	}

	for(service of gatewayTopology.services) {
		metrics.axway_apigateway_version		.set({ gatewayId: service.id, version: service.tags.productVersion, image: service.tags.image }, 1);
	}
	return registry;
}

async function processServiceMetricsFromSystemOverview(params, options) {
	const { systemOverviewMetrics } = params;
	const { logger } = options;
	var cache = options.pluginContext.cache;
	const registry = await getRegistry();
	const metrics = registry._metrics;
	if (!systemOverviewMetrics) {
		throw new Error('Missing required parameter systemOverviewMetrics');
	}
	logger.info(`Processing: ${systemOverviewMetrics.length} service metrics.`);
	for(metric of systemOverviewMetrics) {
		metrics.axway_api_requests_success	.inc({ gatewayId: metric.gatewayId }, await _getDiffInc(metric.successes, `${metric.gatewayId}#requestSuccessCacheKey`, cache, logger));
		metrics.axway_api_requests_failures	.inc({ gatewayId: metric.gatewayId }, await _getDiffInc(metric.failures, `${metric.gatewayId}#requestFailureCacheKey`, cache, logger));
		metrics.axway_api_requests_exceptions	.inc({ gatewayId: metric.gatewayId }, await _getDiffInc(metric.exceptions, `${metric.gatewayId}#requestExceptionsCacheKey`, cache, logger));
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
		logger.info(`Processing service metrics for service: ${metric.name} on gateway: ${metric.gatewayId}`);
		metrics.axway_api_requests_total		.inc({ gatewayId: metric.gatewayId, service: metric.name }, metric.numMessages );
		metrics.axway_api_requests_success		.inc({ gatewayId: metric.gatewayId, service: metric.name }, metric.successes );
		metrics.axway_api_requests_failures		.inc({ gatewayId: metric.gatewayId, service: metric.name }, metric.failures );
		metrics.axway_api_requests_exceptions	.inc({ gatewayId: metric.gatewayId, service: metric.name }, metric.exceptions );
		// For all given processing times 
		var avgProcessed = false;
		var maxProcessed = false;
		var minProcessed = false;
		for(processingTime of metric.processingTimeAvg) {
			// Ignore processingTime 0, as it means, no API-Request has been processed
			if(processingTime ==  0) continue;
			logger.info(`Adding ProcessingTimeAvg ${processingTime} for service: ${metric.name} on gatewayId: ${metric.gatewayId}`);
			metrics.axway_api_requests_duration_avg.observe({ gatewayId: metric.gatewayId, service: metric.name }, processingTime);
			avgProcessed = true;
		}
		for(processingTime of metric.processingTimeMax) {
			// Ignore processingTime 0, as it means, no API-Request has been processed
			if(processingTime ==  0) continue;
			logger.info(`Adding ProcessingTimeMax ${processingTime} for service: ${metric.name} on gatewayId: ${metric.gatewayId}`);
			metrics.axway_api_requests_duration_max.observe({ gatewayId: metric.gatewayId, service: metric.name }, processingTime);
			maxProcessed = true;
		}
		for(processingTime of metric.processingTimeMin) {
			// Ignore processingTime 0, as it means, no API-Request has been processed
			if(processingTime ==  0) continue;			
			logger.info(`Adding ProcessingTimeMin datapoint: ${processingTime} for service: ${metric.name} on gatewayId: ${metric.gatewayId}`);
			metrics.axway_api_requests_duration_min.observe({ gatewayId: metric.gatewayId, service: metric.name }, processingTime);
			minProcessed = true;
		}
		if(avgProcessed == false || maxProcessed == false || minProcessed == false) {
			logger.warn(`Missing timeProcessing time metrics: (avgProcessed: ${avgProcessed}, maxProcessed: ${maxProcessed}, minProcessed: ${minProcessed})`);
		}
	}
	return registry;
}

module.exports = {
	processServiceMetrics,
	processSummaryMetrics,
	processTopologyInfo,
	processServiceMetricsFromSystemOverview,
	getMetrics
};
