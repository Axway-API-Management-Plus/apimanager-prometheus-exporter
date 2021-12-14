const https = require('https');
const { sendRequest, loginToAdminNodeManager } = require('./utils');

var cache;

const metricTypes = {
	"Service": [
		"successes",
		"failures",
		"exceptions", 
		"numMessages",
		"processingTimeAvg",
		"processingTimeMin",
		"processingTimeMax"
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
	const { logger } = options;
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
	return topology;
}

async function getMetricsGroups(params, options) {
	const { topology } = params;
	const anmConfig = options.pluginConfig.adminNodeManager;
	const { logger } = options;
	if (!topology) {
		throw new Error('Missing required parameter: topology');
	}
	var metricGroups = {};
	// Get the metric groups for each API-Gateway instance
	for (const [key, service] of Object.entries(topology.services)) { 
		var groups = await _getMetrics('groups', anmConfig, service.id, logger);
		if(!groups || groups.length==0) {
			logger.warn(`No metrics groups found for gateway instance: ${service.id}`);
			continue;
		}
		metricGroups[service.id] = groups;
	}
	return metricGroups;
}

async function getSummaryMetrics(params, options) {
	const { topology } = params;
	const anmConfig = options.pluginConfig.adminNodeManager;
	const { logger } = options;
	if (!topology) {
		throw new Error('Missing required parameter: topology');
	}
	var summaryMetrics = [];
	for (const [key, service] of Object.entries(topology.services)) {
		var instanceMetrics = await _getMetrics('summary', anmConfig, service.id, logger);
		if(!instanceMetrics || instanceMetrics.length==0) {
			logger.warn(`No summary metrics found for gateway instance: ${service.id}`);
			continue;
		}
		summaryMetrics = summaryMetrics.concat(instanceMetrics);
	}
	return summaryMetrics;
}

async function getTimelineMetrics(params, options) {
	const { topology, metricsType, metricsGroups } = params;
	const anmConfig = options.pluginConfig.adminNodeManager;
	cache = options.pluginContext.cache;
	const { logger } = options;
	if (!topology) {
		throw new Error('Missing required parameter: topology');
	}
	if (!metricsGroups) {
		throw new Error('Missing required parameter: metricsGroups');
	}
	if (!metricsType) {
		throw new Error('Missing required parameter: metricsType');
	}
	var metricTypesQuery = "";
	for (const [key, type] of Object.entries(metricTypes[metricsType])) { 
		metricTypesQuery += `&metricType=${type}`;
	}
	
	var metrics = [];
	for (const [key, service] of Object.entries(topology.services)) { 
		var gwInstanceId = service.id;
		// Check when metrics has been read last time from the API-Gateway instance
		var lastReadTimestamp = cache.get(gwInstanceId);
		if(!lastReadTimestamp) {
			logger.info(`No previous last read timestamp found for API-Gateway instance: ${gwInstanceId}. Reading last data bucket only.`);
		}
		var pointEnd;
		// Iterate over all metric groups for the gateway
		var gwMetricGroups = metricsGroups[gwInstanceId];
		for (const [key, group] of Object.entries(gwMetricGroups)) { 
			if(group.type != metricsType) {
				continue;
			}
			var timelineMetrics = await _getMetrics(`timeline?timeline=10m&metricGroupType=${metricsType}&name=${group.name}${metricTypesQuery}`, anmConfig, gwInstanceId, logger);
			if(!timelineMetrics || timelineMetrics.length==0) {
				throw new Error(`Unexpectly found no timeline metrics for gateway instance: ${gwInstanceId} for ${metricsType}`);
			}
			// Use the first serie from the API-Gateway instance, as they return the same pointStart anyway
			// Add 10 minutes as the endpoint
			pointEnd = timelineMetrics.series[0].pointStart + 600000;

			// Create the required metrics object
			var serviceMetrics = {
				groupType: metricsType,
				gatewayName: service.name,
				gatewayId: service.id,
				groupName: group.name,
				name: group.name
			}
			metrics = metrics.concat(await _getDataFromTimeline(serviceMetrics, timelineMetrics, lastReadTimestamp, pointEnd, logger));
		}
		logger.info(`Successfully created/updated metrics.`);
		cache.set(gwInstanceId, pointEnd)
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
			logger.info(`Group-Name: ${metrics.name} (${serieName}/${metrics.gatewayId}): Reading last ${points2Read} data point for metric ${serieName}`);
			// Variable just to create a nicer log message
			var readDataPoints = [];
			// Iterate over the last datapoints required to read
			for(var i=1; i<=points2Read; i++) {
				// For the processingTimes we try to avoid creating an average of an average and record each processing time individually
				// which will be added later to Histogram buckets
				if(serie.name.startsWith('processingTime')) {
					debugger;
					var avgDataPoint = serie.data[serie.data.length - i];
					if(!metrics[serieName]) metrics[serieName] = [];
					metrics[serieName].push(avgDataPoint);
				} else {
					readDataPoints.push(serie.data[serie.data.length - i]);
					// For total values, we calculate the sum of all datapoints
					value = value + serie.data[serie.data.length - i];
					metrics[serieName] = value;
				}
			}
			if(serie.name.startsWith('processingTime')) {
				logger.info(`Group-Name: ${metrics.name} (${serieName}/${metrics.gatewayId}): Collected last ${points2Read} processing time datapoints: ${JSON.stringify(metrics[serieName])}.`);
			} else {
				logger.info(`Group-Name: ${metrics.name} (${serieName}/${metrics.gatewayId}): Calculated ${value} based on last ${points2Read} datapoints: ${JSON.stringify(readDataPoints)}.`);
			}
		} else {
			// If no data has been read previously, only read the last data bucket 
			// to avoid spikes in the result.
			// However, this requires, that data is constanly scraped by Prom as they set the timestamp
			if(serie.name.startsWith('processingTime')) {
				logger.info(`Group-Name: ${metrics.name} (${serieName}/${metrics.gatewayId}): Using last average bucket value: ${serie.data[serie.data.length - 1]}`);
				if(!metrics[serieName]) metrics[serieName] = [];
				metrics[serieName].push(serie.data[serie.data.length - 1]);
			} else {
				logger.info(`Group-Name: ${metrics.name} (${serieName}/${metrics.gatewayId}): Using last bucket value: ${serie.data[serie.data.length - 1]}`);
				metrics[serieName] = serie.data[serie.data.length - 1];
			}
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
	logger.info(`Get metrics with from instance: ${instanceId} from ANM: ${anmConfig.url}`);
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
				logger.debug(`Error message: ${JSON.stringify(err)}`);
				return [];
			}
			if(err.statusCode == 503) { // API-Gateway might be down
				logger.warn(`Unable to read metrics from Gateway-Instance: ${instanceId}. Got status code: 503. Perhaps instance is down.`);
				logger.debug(`Error message: ${JSON.stringify(err)}`);
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
	getTimelineMetrics,
	getSummaryMetrics
};
