const https = require('https');
const { sendRequest, loginToAdminNodeManager } = require('./utils');

var cache;
/**
 * For some metrics we have to use the max values as the average is not realiable
 */
const metricTypes = {
	"Service": [
		"successes",
		"failures",
		"exceptions", 
		"numMessages",
		"processingTimeAvg"
	],
	"System": [
		"cpuUsedMax", 
		"systemCpuMax", 
		"memoryUsedMax", 
		"diskUsedPercent",
		"systemMemoryTotal",
		"systemMemoryUsed"
	]
}

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
async function lookupTopology(params, options) {
	const anmConfig = options.pluginConfig.adminNodeManager;
	cache = options.pluginContext.cache;
	const { logger } = options;
	if(cache.get('ANM_TOPOLOGY')) {
		options.logger.info(`Return cached topology.`);
		return topology;
	}
	try {
		topology = await _getTopology(anmConfig, logger);
	} catch (err) {
		// Very likely the session has expired
		if(err.statusCode == 403) {
			options.logger.warn(`ANM-Session has expired - Re-Login ...`);
			// Re-Login to API-Manager and try again
			loginToAdminNodeManager(anmConfig, options);
		}
		topology = await _getTopology(anmConfig, logger);
	}
	cache.set('ANM_TOPOLOGY', topology);
	return topology;
}

/**
 * Metrics groups contain all the metrics recorded by the Admin-Node-Managers. 
 * 
 * For instance SystemOverview, Client, Services. They are needed to get the metrics based on the timeline.
 */
async function getMetricsGroups(params, options) {
	const { topology } = params;
	const anmConfig = options.pluginConfig.adminNodeManager;
	cache = options.pluginContext.cache;
	const { logger } = options;
	if (!topology) {
		throw new Error('Missing required parameter: topology');
	}
	var metricGroups = {};
	var allGatewaysFail = true;
	// Get the metric groups for each API-Gateway instance
	for (const [key, service] of Object.entries(topology.services)) { 
		var groups = await _getMetrics('groups', anmConfig, service.id, logger);
		if(!groups || groups.length==0) {
			logger.warn(`No metrics groups found for gateway instance: ${service.id}`);
			
			const { logger } = options;
			if(cache.get('ANM_TOPOLOGY')) {
			continue;
		}
		allGatewaysFail = false;
		metricGroups[service.id] = groups;
	}
	if(allGatewaysFail) {
		throw new Error(`Error reading metric groups from all API-Gateways.`);
	}
	return metricGroups;
}

/**
 * Get system metrics, such a CPU-Usage, Memory usage from the ANM based on the timeline metrics
 */
async function getSystemMetrics(params, options) {
	const { topology, metricsGroups } = params;
	const { logger } = options;
	if (!topology) {
		throw new Error('Missing required parameter: topology');
	}
	if (!metricsGroups) {
		throw new Error('Missing required parameter: metricsGroups');
	}
	var systemMetrics = await _getTimelineMetrics("SystemOverview", metricTypes.System, topology, metricsGroups, options);
	return systemMetrics;
}

/**
 * Get APIs metrics, such as duration from the ANM based on the timeline metrics
 */
 async function getServiceMetrics(params, options) {
	const { topology, metricsGroups } = params;
	const { logger } = options;
	if (!topology) {
		throw new Error('Missing required parameter: topology');
	}
	if (!metricsGroups) {
		throw new Error('Missing required parameter: metricsGroups');
	}
	var serviceMetrics = await _getTimelineMetrics("Service", metricTypes.Service, topology, metricsGroups, options);
	return serviceMetrics;
}

/**
 * Gets metrics from the timeline, which are more precise, than using average values calculated on the last 10 minutes. 
 * 
 * This function returns the last non-read metric datapoints. 
 * Depending on the metric type they might be threated differntly (e.g. avg metrics, vs. count metrics)
 */
async function _getTimelineMetrics(metricGroupType, metricTypes, topology, metricsGroups, options) {
	const anmConfig = options.pluginConfig.adminNodeManager;
	cache = options.pluginContext.cache;
	const { logger } = options;
	if (!topology) {
		throw new Error('Missing required parameter: topology');
	}
	if (!metricsGroups) {
		throw new Error('Missing required parameter: metricsGroups');
	}
	if (!metricGroupType) {
		throw new Error('Missing required parameter: metricGroupType');
	}
	var metricTypesQuery = "";
	for (type of metricTypes) { 
		metricTypesQuery += `&metricType=${type}`;
	}
	var metrics = [];
	var failedAPIGateways = [];
	// For each API-Gateway found in the given topology ...
	for (const [key, service] of Object.entries(topology.services)) { 
		var gwInstanceId = service.id;
		// Check when metrics has been read last time from the API-Gateway instance
		var lastReadTimestamp = cache.get(`${gwInstanceId}###${metricGroupType}`);
		if(!lastReadTimestamp) {
			logger.info(`No previous last read timestamp found for API-Gateway instance: ${gwInstanceId} and metric group: ${metricGroupType}. Reading last data bucket only.`);
		}
		var pointEnd;
		// Iterate over all metric groups for the gateway 
		// For instance MetricGroupType: Service has multiple entries each with a different name that contains the API-Name
		// And SystemOverview has only one entry, but supports different metricTypes such as systemCpuAvg or memoryUsedAvg, etc.
		var gwMetricGroups = metricsGroups[gwInstanceId];
		if(!gwMetricGroups) {
			logger.error(`No metrics groups for gateway instance: ${gwInstanceId}. Cannot read timeline metrics without it.`);
			failedAPIGateways.push(gwInstanceId);
			continue;
		}
		for (const [key, group] of Object.entries(gwMetricGroups)) { 
			if(group.type != metricGroupType) {
				continue;
			}
			var timelineMetrics = await _getMetrics(`timeline?timeline=10m&metricGroupType=${metricGroupType}&name=${group.name}${metricTypesQuery}`, anmConfig, gwInstanceId, logger);
			if(!timelineMetrics || timelineMetrics.length==0) {
				logger.warn(`Error reading timeline metrics from gateway instance: ${gwInstanceId} for ${metricGroupType}`);
				failedAPIGateways.push(gwInstanceId);
				break; // No need to iterate over additional mectricGroups for this API-Gateway
			}
			// Use the first datapoint (which is basically the latest) from the returned API-Gateway timeline series
			// As they return the same pointStart as request just add 10 minutes as the endpoint
			pointEnd = timelineMetrics.series[0].pointStart + 600000;

			// Create the required metrics object
			var finalMetrics = {
				groupType: metricGroupType,
				gatewayName: service.name,
				gatewayId: service.id,
				groupName: group.name,
				name: group.name
			}
			metrics = metrics.concat(await _getDataFromTimeline(finalMetrics, timelineMetrics, lastReadTimestamp, pointEnd, logger));
		}
		cache.set(`${gwInstanceId}###${metricGroupType}`, pointEnd);
	}
	logger.info(`Updated metrics from ANM for ${topology.services.length} API-Gateways. Failed: ${failedAPIGateways.length}.`);
	if(failedAPIGateways.length>0) {
		logger.warn(`There was an error reading metrics from ${failedAPIGateways} out of ${topology.services.length} API-Gateway instances.`);
		if(failedAPIGateways.length==topology.services.length) {
			throw new Error(`Error reading metrics from all API-Gateways: ${failedAPIGateways}.`);
		}	
	}
	return metrics;
}

async function _getDataFromTimeline(metrics, timelineMetrics, lastReadTimestamp, pointEnd, logger) {
	var series = timelineMetrics.series;
	var pointInterval = series[0].pointInterval;
	for (const [key, serie] of Object.entries(series)) {
		var serieName = serie.name;
		if(lastReadTimestamp) {
			// If we do have a known lastReadTimestamp, read metrics only up to that point as previous data point have been read before
			// Get the difference between current timestamp and last read
			var diff = pointEnd - lastReadTimestamp;
			if(diff > 600000) { // Difference is bigger than the max range of data / Perhaps the scraper was not running
				// Reset it and only read the last data point
				logger.error(`Group-Name: ${metrics.name} (${serieName}/${metrics.gatewayId}): Unexpected difference: ${diff} between last read timestamp and current data set.`);
				metrics[serieName] = serie.data[serie.data.length - 1];
				continue;
			}
			// Depending on the difference, we know how many data points to read
			var points2Read = diff/pointInterval;
			var value = 0;
			// Iterate over the last datapoints required to read
			for(var i=1; i<=points2Read; i++) {
				// Return the read datapoints which can be processed depending on the type
				var readDatapoints = serie.data[serie.data.length - i];
				if(!metrics[serieName]) metrics[serieName] = [];
				metrics[serieName].push(readDatapoints);
			}
			logger.info(`Group-Name: ${metrics.name} (${serieName}/${metrics.gatewayId}): Read last ${points2Read} datapoints: ${JSON.stringify(metrics[serieName])}.`);
		} else {
			// If no data has been read previously, just read the last data point only to avoid unrealistic spikes in the result.
			logger.info(`Group-Name: ${metrics.name} (${serieName}/${metrics.gatewayId}): Return last datapoint: ${serie.data[serie.data.length - 1]}`);
			if(!metrics[serieName]) metrics[serieName] = [];
			metrics[serieName].push(serie.data[serie.data.length - 1]);
		}
	}
	return metrics;
}

async function _getTopology(anmConfig, logger) {
	var options = {
		path: '/api/topology',
		headers: anmConfig.requestHeaders,
		agent: new https.Agent({ rejectUnauthorized: false })
	};
	logger.debug(`Trying to read topology from Admin-Node-Manager: ${anmConfig.url}`);
	var topology = await sendRequest(anmConfig.url, options)
		.then(response => {
			return response.body.result;
		})
		.catch(err => {
			logger.error(`Error getting API-Gateway topology from Admin-Node-Manager. Request sent to: '${anmConfig.url}'. Response-Code: ${err.statusCode}`);
			throw err;
		});
	if(topology.services) {
		topology.services = topology.services.filter(function(service) {
			return service.type!="nodemanager"; // Filter node manager service
		});
		logger.info(`Successfully retrieved topology from Admin-Node-Manager. Is cached for 2 minutes.`);
		return topology;
	}
	return topology;
}

async function _getMetrics(metricsResource, anmConfig, instanceId, logger) {
	logger.info(`Get metrics for instance: ${instanceId} from ANM: ${anmConfig.url}`);
	var options = {
		path: `/api/router/service/${instanceId}/api/monitoring/metrics/${metricsResource}`,
		headers: anmConfig.requestHeaders,
		agent: new https.Agent({ rejectUnauthorized: false }),
		timeout: 2000
	};
	logger.debug(`Trying to read metrics: '${metricsResource}' from Admin-Node-Manager: ${anmConfig.url}`);
	var metrics = await sendRequest(anmConfig.url, options)
		.then(response => {
			return response.body.result;
		})
		.catch(err => {
			if(err.code == "ECONNRESET") {
				logger.warn(`Unable to read metrics from Gateway-Instance: ${instanceId}. Request timed out (ECONNRESET). Perhaps instance is down.`);
				logger.error(`Error message: ${JSON.stringify(err)}`);
				return [];
			}
			if(err.statusCode == 503 || err.statusCode == 500) { // API-Gateway might be down
				logger.warn(`Unable to read metrics from Gateway-Instance: ${instanceId}. Got status code: ${err.statusCode}. Perhaps instance doesn't exists anymore.`);
				logger.error(`Error message: ${JSON.stringify(err)}`);
				return [];
			} 
			logger.error(`Error getting API-Gateway metrics: '${metricsResource}' from Admin-Node-Manager. Request sent to: '${anmConfig.url}'. Response-Code: ${err.statusCode}`);
			throw err;
		});
	return metrics;
}

module.exports = {
	lookupTopology,
	getMetricsGroups,
	getServiceMetrics,
	getSystemMetrics
};
