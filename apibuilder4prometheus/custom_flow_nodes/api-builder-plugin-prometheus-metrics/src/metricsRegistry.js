const client = require('prom-client');

var testRegistry;

async function createRegistry(pluginConfig, logger) {
    if(pluginConfig.registry) {
        logger.info('Using provided test registry.');
        testRegistry = pluginConfig.registry;
        return testRegistry;
    } else if(Object.keys(client.register._metrics).length>0) {
        logger.info('Prometheus Metrics-Registry already created.');
        return client.register;
    } else {
        logger.info('Creating new Prometheus Metrics-Registry.');
        new client.Registry();
        new client.Gauge({ name: 'axway_apigateway_version',       help: 'Version information about the API-Gateway', labelNames: ['gatewayId', 'version', 'image']});
        new client.Gauge({ name: 'up',                             help: 'up 1 = up, 0 = not up', labelNames: ['gatewayId']});

        new client.Gauge({ name: 'axway_apigateway_instance_disk_used',     help: 'Percentage of disk used (disk on which the API Gateway instance is running: $VINSTDIR)', labelNames: ['gatewayId']});
        new client.Gauge({ name: 'axway_apigateway_instance_cpu',           help: 'Percentage of current process CPU usage (total usage divided by the number of cores', labelNames: ['gatewayId']});
        new client.Gauge({ name: 'axway_apigateway_instance_cpu_avg',       help: 'Average CPU usage per instance in a 10 minutes time range', labelNames: ['gatewayId']});
        new client.Gauge({ name: 'axway_apigateway_instance_cpu_min',       help: 'Min CPU usage per instance in a 10 minutes time range', labelNames: ['gatewayId']});
        new client.Gauge({ name: 'axway_apigateway_instance_cpu_max',       help: 'Max CPU usage per instance in a 10 minutes time range', labelNames: ['gatewayId']});
        new client.Gauge({ name: 'axway_apigateway_system_cpu_avg',         help: 'Average CPU usage on the system in a 10 minutes time range', labelNames: ['gatewayId']});
        new client.Gauge({ name: 'axway_apigateway_system_cpu_min',         help: 'Min CPU usage on the system in a 10 minutes time range', labelNames: ['gatewayId']});
        new client.Gauge({ name: 'axway_apigateway_system_cpu_max',         help: 'Max CPU usage on the system in a 10 minutes time range', labelNames: ['gatewayId']});
        new client.Gauge({ name: 'axway_apigateway_instance_memory_avg',    help: 'Avg Memory used by the API-Gateway instance JVM (in KB) in a 10 minutes time range', labelNames: ['gatewayId']});
        new client.Gauge({ name: 'axway_apigateway_instance_memory_min',    help: 'Min Memory used by the API-Gateway instance JVM (in KB) in a 10 minutes time range', labelNames: ['gatewayId']});
        new client.Gauge({ name: 'axway_apigateway_instance_memory_max',    help: 'Max Memory used by the API-Gateway instance JVM (in KB) in a 10 minutes time range', labelNames: ['gatewayId']});
        new client.Gauge({ name: 'axway_apigateway_system_memory',          help: 'System memory used (in KB)', labelNames: ['gatewayId']});
        new client.Gauge({ name: 'axway_apigateway_system_memory_total',    help: 'System total memory size (in KB).', labelNames: ['gatewayId']});
    
        new client.Counter({ name: 'axway_api_requests_total',          help: 'The total number of API-Requests', labelNames: ['gatewayId', 'service']});
        new client.Counter({ name: 'axway_api_requests_success',        help: 'The total number of successful API-Requests', labelNames: ['gatewayId', 'service']});
        new client.Counter({ name: 'axway_api_requests_failures',       help: 'The total number of failure API-Requests', labelNames: ['gatewayId', 'service']});
        new client.Counter({ name: 'axway_api_requests_exceptions',     help: 'The total number of exception API-Requests', labelNames: ['gatewayId', 'service']});

        new client.Histogram({ name: 'axway_api_requests_duration_avg', help: 'The average API-Request duration', buckets: [10, 20, 50, 100, 250, 500, 1000], labelNames: ['gatewayId', 'service'] });
        new client.Histogram({ name: 'axway_api_requests_duration_max', help: 'The maximum API-Request duration', buckets: [10, 20, 50, 100, 250, 500, 1000], labelNames: ['gatewayId', 'service'] });
        new client.Histogram({ name: 'axway_api_requests_duration_min', help: 'The minimum API-Request duration', buckets: [10, 20, 50, 100, 250, 500, 1000], labelNames: ['gatewayId', 'service'] });

        logger.info('Prometheus Metrics-Registries successfully created.');
    }
    return client.register;
}

async function getRegistry() {
    if(testRegistry && Object.keys(testRegistry._metrics).length>0) {
        debugger;
        console.log(`Using provided test registry.`);
        return testRegistry;
    }
    return client.register;
}

module.exports = {
    createRegistry,
    getRegistry
}