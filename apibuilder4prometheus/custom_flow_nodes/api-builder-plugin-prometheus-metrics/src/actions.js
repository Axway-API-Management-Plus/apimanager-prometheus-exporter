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
		metrics.gateway_instance_disk_used		.set({ instance: metric.gatewayId }, metric.diskUsedPercent);
		metrics.gateway_instance_cpu			.set({ instance: metric.gatewayId }, metric.cpuUsed);
		metrics.gateway_instance_cpu_avg		.set({ instance: metric.gatewayId }, metric.cpuUsedAvg);
		metrics.gateway_instance_cpu_min		.set({ instance: metric.gatewayId }, metric.cpuUsedMin);
		metrics.gateway_instance_cpu_max		.set({ instance: metric.gatewayId }, metric.cpuUsedMax);
		metrics.gateway_system_cpu_avg			.set({ instance: metric.gatewayId }, metric.systemCpuAvg);
		metrics.gateway_system_cpu_min			.set({ instance: metric.gatewayId }, metric.systemCpuMin);
		metrics.gateway_system_cpu_max			.set({ instance: metric.gatewayId }, metric.systemCpuMax);
		metrics.gateway_instance_memory_min		.set({ instance: metric.gatewayId }, metric.memoryUsedMin);
		metrics.gateway_instance_memory_max		.set({ instance: metric.gatewayId }, metric.memoryUsedMax);
		metrics.gateway_instance_memory_avg		.set({ instance: metric.gatewayId }, metric.memoryUsedAvg);
		metrics.gateway_system_memory			.set({ instance: metric.gatewayId }, metric.systemMemoryUsed);
		metrics.gateway_system_memory_total		.set({ instance: metric.gatewayId }, metric.systemMemoryTotal);
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
		metrics.api_requests_success	.inc({ instance: metric.gatewayId }, await _getDiffInc(metric.successes, `${metric.gatewayId}#requestSuccessCacheKey`, cache, logger));
		metrics.api_requests_failures	.inc({ instance: metric.gatewayId }, await _getDiffInc(metric.failures, `${metric.gatewayId}#requestFailureCacheKey`, cache, logger));
		metrics.api_requests_exceptions	.inc({ instance: metric.gatewayId }, await _getDiffInc(metric.exceptions, `${metric.gatewayId}#requestExceptionsCacheKey`, cache, logger));
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
		metrics.api_requests_total		.inc({ instance: metric.gatewayId, service: metric.name }, metric.numMessages );
		metrics.api_requests_success	.inc({ instance: metric.gatewayId, service: metric.name }, metric.successes );
		metrics.api_requests_failures	.inc({ instance: metric.gatewayId, service: metric.name }, metric.failures );
		metrics.api_requests_exceptions	.inc({ instance: metric.gatewayId, service: metric.name }, metric.exceptions );
	}
	return serviceRegistry;
}


module.exports = {
	mergeRegistries,
	processServiceMetrics,
	processSummaryMetrics,
	processServiceMetricsFromSystemOverview
};
