const client = require('prom-client');

var registry;

async function createRegistry(pluginConfig, logger) {
    if(pluginConfig.registry) {
        registry = pluginConfig.registry;
        logger.info('Prometheus Metrics-Registry already created.');
    } else {
        registry = new client.Registry();
        createAndRegisterMetric(client.Gauge, 'axway_apigateway_version',       'Version information about the API-Gateway', ['gatewayId', 'version', 'image']);
        createAndRegisterMetric(client.Gauge, 'up',                             'up 1 = up, 0 = not up', ['gatewayId']);

        createAndRegisterMetric(client.Gauge, 'axway_apigateway_instance_disk_used',     'Percentage of disk used (disk on which the API Gateway instance is running: $VINSTDIR)', ['gatewayId']);
        createAndRegisterMetric( client.Gauge, 'axway_apigateway_instance_cpu',           'Percentage of current process CPU usage (total usage divided by the number of cores', ['gatewayId']);
        createAndRegisterMetric(client.Gauge, 'axway_apigateway_instance_cpu_avg',       'Average CPU usage per instance in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(client.Gauge, 'axway_apigateway_instance_cpu_min',       'Min CPU usage per instance in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(client.Gauge, 'axway_apigateway_instance_cpu_max',       'Max CPU usage per instance in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(client.Gauge, 'axway_apigateway_system_cpu_avg',         'Average CPU usage on the system in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(client.Gauge, 'axway_apigateway_system_cpu_min',         'Min CPU usage on the system in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(client.Gauge, 'axway_apigateway_system_cpu_max',         'Max CPU usage on the system in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(client.Gauge, 'axway_apigateway_instance_memory_avg',    'Avg Memory used by the API-Gateway instance JVM (in KB) in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(client.Gauge, 'axway_apigateway_instance_memory_min',    'Min Memory used by the API-Gateway instance JVM (in KB) in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(client.Gauge, 'axway_apigateway_instance_memory_max',    'Max Memory used by the API-Gateway instance JVM (in KB) in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(client.Gauge, 'axway_apigateway_system_memory',          'System memory used (in KB)', ['gatewayId']);
        createAndRegisterMetric(client.Gauge, 'axway_apigateway_system_memory_total',    'System total memory size (in KB).', ['gatewayId']);
    
        createAndRegisterMetric(client.Counter, 'axway_api_requests_total',          'The total number of API-Requests', ['gatewayId', 'service']);
        createAndRegisterMetric(client.Counter, 'axway_api_requests_success',        'The total number of successful API-Requests', ['gatewayId', 'service']);
        createAndRegisterMetric(client.Counter, 'axway_api_requests_failures',       'The total number of failure API-Requests', ['gatewayId', 'service']);
        createAndRegisterMetric(client.Counter, 'axway_api_requests_exceptions',     'The total number of exception API-Requests', ['gatewayId', 'service']);
    
        logger.info('Prometheus Metrics-Registries successfully created.');
    }
    return registry;
}

async function getRegistry(name, logger) {
    return registry;
}

function createAndRegisterMetric(metricType, name, help, labelNames) {
    const metric		= new metricType({ registers: [], name: name, help: help,	labelNames: labelNames });
    registry.registerMetric(metric);
}

module.exports = {
    createRegistry,
    getRegistry
}