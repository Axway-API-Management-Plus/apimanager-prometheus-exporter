const client = require('prom-client');
const { getRegistry } = require( './metricsRegistries' );
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
 
async function mergeRegistries(params, options) {
	debugger;
	const { returnMetrics } = params;
	const mergedRegistries = client.Registry.merge(options.pluginContext.registries);
	if(returnMetrics) {
		return mergedRegistries.metrics();
	} else {
		return mergedRegistries;
	}
}

async function processSummaryMetrics(params, options) {
	debugger;
	const { summaryMetrics } = params;
	const { logger } = options;
	const systemOverviewRegistry = await getRegistry('systemOverviewRegistry');
	const metrics = systemOverviewRegistry._metrics;
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
	return systemOverviewRegistry;
}

async function processServiceMetricsFromSystemOverview(params, options) {
	const { systemOverviewMetrics } = params;
	const { logger } = options;
	var cache = options.pluginContext.cache;
	const serviceRegistry = await getRegistry('serviceRegistry');
	const metrics = serviceRegistry._metrics;
	if (!systemOverviewMetrics) {
		throw new Error('Missing required parameter systemOverviewMetrics');
	}
	logger.info(`Processing: ${systemOverviewMetrics.length} service metrics.`);
	for(metric of systemOverviewMetrics) {
		metrics.axway_api_requests_success	.inc({ gatewayId: metric.gatewayId }, await _getDiffInc(metric.successes, `${metric.gatewayId}#requestSuccessCacheKey`, cache, logger));
		metrics.axway_api_requests_failures	.inc({ gatewayId: metric.gatewayId }, await _getDiffInc(metric.failures, `${metric.gatewayId}#requestFailureCacheKey`, cache, logger));
		metrics.axway_api_requests_exceptions	.inc({ gatewayId: metric.gatewayId }, await _getDiffInc(metric.exceptions, `${metric.gatewayId}#requestExceptionsCacheKey`, cache, logger));
	}
	return serviceRegistry;
}

async function processServiceMetrics(params, options) {
	const { serviceMetrics } = params;
	const { logger } = options;
	var cache = options.pluginContext.cache;
	const serviceRegistry = await getRegistry('serviceRegistry');
	const metrics = serviceRegistry._metrics;
	if (!serviceMetrics) {
		throw new Error('Missing required parameter serviceMetrics');
	}
	logger.info(`Processing: ${serviceMetrics.length} service metrics.`);
	for(metric of serviceMetrics) {
		metrics.axway_api_requests_total		.inc({ gatewayId: metric.gatewayId, service: metric.name }, metric.numMessages );
		metrics.axway_api_requests_success	.inc({ gatewayId: metric.gatewayId, service: metric.name }, metric.successes );
		metrics.axway_api_requests_failures	.inc({ gatewayId: metric.gatewayId, service: metric.name }, metric.failures );
		metrics.axway_api_requests_exceptions	.inc({ gatewayId: metric.gatewayId, service: metric.name }, metric.exceptions );
	}
	return serviceRegistry;
}


module.exports = {
	mergeRegistries,
	processServiceMetrics,
	processSummaryMetrics,
	processServiceMetricsFromSystemOverview
};
