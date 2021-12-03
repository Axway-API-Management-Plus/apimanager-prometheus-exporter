const client = require('prom-client');

var registries;
var registriesByName = {};

async function createRegistries(pluginConfig, logger) {
    if(pluginConfig.registries) {
        registries = pluginConfig.registries;
        logger.info('Prometheus Metrics-Registries already created.');
    } else {
        registries = [];
        const systemOverviewRegistry = new client.Registry();
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_instance_disk_used',     'Percentage of disk used (disk on which the API Gateway instance is running: $VINSTDIR)', ['gatewayId']);
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_instance_cpu',           'Percentage of current process CPU usage (total usage divided by the number of cores', ['gatewayId']);
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_instance_cpu_avg',       'Average CPU usage per instance in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_instance_cpu_min',       'Min CPU usage per instance in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_instance_cpu_max',       'Max CPU usage per instance in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_system_cpu_avg',         'Average CPU usage on the system in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_system_cpu_min',         'Min CPU usage on the system in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_system_cpu_max',         'Max CPU usage on the system in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_instance_memory_avg',    'Avg Memory used by the API-Gateway instance JVM (in KB) in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_instance_memory_min',    'Min Memory used by the API-Gateway instance JVM (in KB) in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_instance_memory_max',    'Max Memory used by the API-Gateway instance JVM (in KB) in a 10 minutes time range', ['gatewayId']);
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_system_memory',          'System memory used (in KB)', ['gatewayId']);
        createAndRegisterMetric(systemOverviewRegistry, client.Gauge, 'gateway_system_memory_total',    'System total memory size (in KB).', ['gatewayId']);
        registries.push(systemOverviewRegistry);
        registriesByName.systemOverviewRegistry = systemOverviewRegistry;
    
        const serviceRegistry = new client.Registry();
        createAndRegisterMetric(serviceRegistry, client.Counter, 'api_requests_total',          'The total number of API-Requests', ['gatewayId', 'service']);
        createAndRegisterMetric(serviceRegistry, client.Counter, 'api_requests_success',        'The total number of successful API-Requests', ['gatewayId', 'service']);
        createAndRegisterMetric(serviceRegistry, client.Counter, 'api_requests_failures',       'The total number of failure API-Requests', ['gatewayId', 'service']);
        createAndRegisterMetric(serviceRegistry, client.Counter, 'api_requests_exceptions',     'The total number of exception API-Requests', ['gatewayId', 'service']);
        registries.push(serviceRegistry);
        registriesByName.serviceRegistry = serviceRegistry;
    
        logger.info('Prometheus Metrics-Registries successfully created.');
    }
    return registries;
}

async function getRegistry(name, logger) {
    return registriesByName[name];
}

function createAndRegisterMetric(registry, metricType, name, help, labelNames) {
    const metric		= new metricType({ registers: [], name: name, help: help,	labelNames: labelNames });
    registry.registerMetric(metric);
}

module.exports = {
    createRegistries,
    getRegistry,
    registries
}