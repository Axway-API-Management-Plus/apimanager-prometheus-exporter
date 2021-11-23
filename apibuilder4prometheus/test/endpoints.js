const { expect } = require('chai');
const { startApiBuilder, stopApiBuilder, requestAsync } = require('./_base');

describe('Endpoints', function () {
	this.timeout(30000);
	let server;

	/**
	 * Start API Builder.
	 */
	before(() => {
		server = startApiBuilder();
		return server.started;
	});

	/**
	 * Stop API Builder after the tests.
	 */
	after(() => stopApiBuilder(server));

	describe('Prom-Metrics', () => {
		it.only('[Endpoint-0001] should be able to hit Prom-Metrics endpoint', () => {
			return requestAsync({
				method: 'GET',
				uri: `http://localhost:${server.apibuilder.port}/api/metrics`,
				json: true
			}).then(({ response, body }) => {
				expect(response.statusCode).to.equal(200);;
			});
		});
	});
});
