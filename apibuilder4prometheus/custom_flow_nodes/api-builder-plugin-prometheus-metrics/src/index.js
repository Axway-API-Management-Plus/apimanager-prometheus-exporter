const path = require('path');
const { SDK } = require('@axway/api-builder-sdk');
const actions = require('./actions');
const NodeCache = require( "node-cache" );
const { createRegistries } = require( './metricsRegistries' );

/**
 * Resolves the API Builder plugin.
 * @param {object} pluginConfig - The service configuration for this plugin
 *   from API Builder config.pluginConfig['api-builder-plugin-pluginName']
 * @param {string} pluginConfig.proxy - The configured API-builder proxy server
 * @param {object} options - Additional options and configuration provided by API Builder
 * @param {string} options.appDir - The current directory of the service using the plugin
 * @param {string} options.logger - An API Builder logger scoped for this plugin
 * @returns {object} An API Builder plugin.
 */
async function getPlugin(pluginConfig, options) {
	const cache = new NodeCache({ stdTTL: 60, useClones: false });
	const sdk = new SDK({ pluginConfig });
	var registries = await createRegistries(pluginConfig, options.logger);
	sdk.load(path.resolve(__dirname, 'flow-nodes.yml'), actions, { pluginContext: { cache: cache, registries }, pluginConfig } );
	return sdk.getPlugin();
}

module.exports = getPlugin;
