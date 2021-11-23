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
	const { returnMetrics } = params;
	const mergedRegistries = client.Registry.merge(options.pluginContext.registries);
	if(returnMetrics) {
		return mergedRegistries.metrics();
	} else {
		return mergedRegistries;
	}
}

async function processSystemOverviewMetrics(params, options) {
	const { systemOverviewMetrics } = params;
	const { logger } = options;
	const systemOverviewRegistry = await getRegistry('systemOverviewRegistry');
	const metrics = systemOverviewRegistry._metrics;
	if (!systemOverviewMetrics) {
		throw new Error('Missing required parameter systemOverviewMetrics');
	}

	for(metric of systemOverviewMetrics) {
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

async function processServiceMetrics(params, options) {
	debugger;
	const { serviceMetrics } = params;
	const { logger } = options;
	var cache = options.pluginContext.cache;
	const serviceRegistry = await getRegistry('serviceRegistry');
	const metrics = serviceRegistry._metrics;
	if (!serviceMetrics) {
		throw new Error('Missing required parameter serviceMetrics');
	}
	var i = 0;
	logger.info(`Processing: ${serviceMetrics.length} service metrics.`);
	for(metric of serviceMetrics) {
		logger.info(`i: ${i}`);
		metrics.api_requests_total		.inc({ instance: metric.gatewayId, service: metric.name }, await _getDiffInc(metric.numMessages, `${metric.gatewayId}#${metric.name}#requestTotalCacheKey`, cache, logger));
		metrics.api_requests_success	.inc({ instance: metric.gatewayId, service: metric.name }, await _getDiffInc(metric.successes, `${metric.gatewayId}#${metric.name}#requestSuccessCacheKey`, cache, logger));
		metrics.api_requests_failures	.inc({ instance: metric.gatewayId, service: metric.name }, await _getDiffInc(metric.failures, `${metric.gatewayId}#${metric.name}#requestFailureCacheKey`, cache, logger));
		metrics.api_requests_exceptions	.inc({ instance: metric.gatewayId, service: metric.name }, await _getDiffInc(metric.exceptions, `${metric.gatewayId}#${metric.name}#requestExceptionsCacheKey`, cache, logger));
		i++;
	}
	return serviceRegistry;
}

async function _getDiffInc(currentValue, cacheKey, cache, logger) {
	// Counts are given within the 10 minutes interval, hence they are not increasing anymore after 10 minutes. 
	// To get a real counter, we have to calculate the difference and add this to the counter
	var increment = 0;
	if(cache.has(cacheKey)) {
		// Caclulate the difference between previous value and new value
		var previosValue = cache.get(cacheKey);
		logger.debug(`Found previous value: ${previosValue} in cache with key: ${cacheKey}`);
		increment = currentValue - previosValue;
		logger.info(`Caclulated increment: ${increment} based on currentValue: ${currentValue} and ${previosValue}`);
		cache.set(cacheKey, currentValue); // Store the given numValue
		cache.ttl(cacheKey, 60);
	} else {
		logger.debug(`No previous value found. Storing current value: ${currentValue} with cache key: ${cacheKey}`);
		// No previously found value count
		cache.set(cacheKey, currentValue);
		cache.ttl(cacheKey, 60);
		increment = currentValue;
	}
	return increment;
}


module.exports = {
	mergeRegistries,
	processServiceMetrics,
	processSystemOverviewMetrics
};
