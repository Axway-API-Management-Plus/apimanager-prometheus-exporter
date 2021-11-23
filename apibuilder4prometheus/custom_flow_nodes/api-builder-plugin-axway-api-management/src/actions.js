const https = require('https');
const { sendRequest } = require('./utils');
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
	topology = await _getTopology(anmConfig, logger);
	return topology;
}

async function getMetrics(params, options) {
	const { topology, metricsType } = params;
	const anmConfig = options.pluginConfig.adminNodeManager;
	const { logger } = options;
	if (!topology) {
		throw new Error('Missing required parameter: topology');
	}
	if (!metricsType) {
		throw new Error('Missing required parameter: metricsType');
	}
	var metrics = [];
	for (const [key, service] of Object.entries(topology.services)) { 
		var instanceMetrics = await _getMetrics(anmConfig, service.id, metricsType, logger);
		if(!instanceMetrics || instanceMetrics.length==0) {
			logger.warn(`No ${metricsType} metrics found for gateway instance: ${service.id}`);
			continue;
		}
		metrics = metrics.concat(instanceMetrics);
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

async function _getMetrics(anmConfig, instanceId, metricsType, logger) {
	logger.info(`Get metrics with group type: ${metricsType} from instance: ${instanceId} from ANM: ${anmConfig.url}`);
	var options = {
		path: `/api/router/service/${instanceId}/api/monitoring/metrics/summary?timeline=10minutes&metricGroupType=${metricsType}`,
		headers: anmConfig.requestHeaders,
		agent: new https.Agent({ rejectUnauthorized: false })
	};
	logger.debug(`Trying to read metrics from Admin-Node-Manager: ${anmConfig.url}`);
	var metrics = await sendRequest(anmConfig.url, options)
		.then(response => {
			return response.body.result;
		})
		.catch(err => {
			logger.error(`Error getting API-Gateway metrics from Admin-Node-Manager. Request sent to: '${anmConfig.url}'. Response-Code: ${err.statusCode}`);
			throw err;
		});
	return metrics;
}

module.exports = {
	lookupTopology,
	getMetrics
};
