const APIBuilder = require('@axway/api-builder-runtime');
const server = new APIBuilder();
const promBundle = require("express-prom-bundle");

/*const metricsMiddleware = promBundle({
	includeMethod: true, metricsPath: '/api/prom/metrics',
	includePath: true, 
	includeStatusCode: true, 
	includeUp: true,
	customLabels: {project_name: 'prom-exporter'},
	promClient: {
		collectDefaultMetrics: {
		}
	}
});
server.middleware.app.use(metricsMiddleware);*/

// lifecycle examples
server.once('starting', function () {
	server.logger.debug('server is starting!');
});

server.once('started', function () {
	server.logger.debug('server started!');
});

// start the server
server.start();
