const client = require('prom-client');

var registry;
var testRegistry;

async function createRegistry(pluginConfig, logger) {
    if(pluginConfig.registry) {
        logger.info('Using provided test registry.');
        testRegistry = pluginConfig.registry;
        return testRegistry;
    } else if(Object.keys(client.register._metrics).length>0) {
        logger.info('Prometheus Metrics-Registry already created.');
        return registry;
    } else {
        logger.info('Creating new Prometheus Metrics-Registry.');
        registry = new client.Registry();
        registryMetric( client.Gauge, { name: 'axway_apigateway_version_info',               help: 'Version information about the API-Gateway', labelNames: ['gatewayId', 'version', 'image'], registers: []});
        registryMetric( client.Gauge, { name: 'up',                                          help: 'up 1 = up, 0 = not up', labelNames: ['gatewayId'], registers: []});

        registryMetric( client.Gauge, { name: 'axway_apigateway_instance_disk_used_ratio',   help: 'Percentage of disk used (disk on which the API-Gateway instance is running: $VINSTDIR) (ANM metric: diskUsedPercent)', labelNames: ['gatewayId'], registers: []});
        registryMetric( client.Gauge, { name: 'axway_apigateway_instance_cpu_ratio',         help: 'Percentage of current API-Gateway process CPU usage. (ANM metric: cpuUsed)', labelNames: ['gatewayId'], registers: []});
        registryMetric( client.Gauge, { name: 'axway_apigateway_system_cpu_ratio',         help: 'Total CPU usage of all processes running on the machine as a percentage. (ANM metric: systemCpuAvg)', labelNames: ['gatewayId'], registers: []});
        registryMetric( client.Gauge, { name: 'axway_apigateway_memory_used_bytes',          help: 'The memory consumed by the API-Gateway in bytes. (ANM metric: memoryUsedAvg)', labelNames: ['gatewayId'], registers: []});
        registryMetric( client.Gauge, { name: 'axway_apigateway_system_memory_total_bytes',  help: 'The total memory available on the machine in bytes. (ANM metric: systemMemoryTotal)', labelNames: ['gatewayId'], registers: []});
        registryMetric( client.Gauge, { name: 'axway_apigateway_system_memory_used_bytes',   help: 'The memory consumed of all processes running on the system in bytes. (ANM metric: systemMemoryUsed)', labelNames: ['gatewayId'], registers: []});
    
        registryMetric( client.Counter, { name: 'axway_api_requests_total',          help: 'The total number of API-Requests', labelNames: ['gatewayId', 'service'], registers: []});
        registryMetric( client.Counter, { name: 'axway_api_requests_success',        help: 'The total number of successful API-Requests', labelNames: ['gatewayId', 'service'], registers: []});
        registryMetric( client.Counter, { name: 'axway_api_requests_failures',       help: 'The total number of failure API-Requests', labelNames: ['gatewayId', 'service'], registers: []});
        registryMetric( client.Counter, { name: 'axway_api_requests_exceptions',     help: 'The total number of exception API-Requests', labelNames: ['gatewayId', 'service'], registers: []});

        registryMetric( client.Histogram, { name: 'axway_api_requests_duration_milliseconds', help: 'The API-Request duration. (ANM metric: processingTimeAvg)', buckets: [0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1], labelNames: ['gatewayId', 'service'], registers: []});

        logger.info('Prometheus Metrics-Registry successfully created.');
    }
    return registry;
}

async function getRegistry() {
    if(testRegistry && Object.keys(testRegistry._metrics).length>0) {
        console.log(`Using provided test registry.`);
        return testRegistry;
    }
    return registry;
}

async function registryMetric(metricType, parameter) {
    registry.registerMetric(new metricType(parameter));
}

module.exports = {
    createRegistry,
    getRegistry
}