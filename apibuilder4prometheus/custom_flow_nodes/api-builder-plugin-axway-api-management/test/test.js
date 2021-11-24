const { expect } = require('chai');
const { MockRuntime } = require('@axway/api-builder-test-utils');
const getPlugin = require('../src');
const path = require('path');
const fs = require('fs');
const nock = require('nock');
const envLoader = require('dotenv');
const decache = require('decache');
const NodeCache = require( "node-cache" );

const testCache = new NodeCache({ stdTTL: 60, useClones: false });

describe('Tests', () => {
	let plugin;
	let flowNode;

	// Loads environment variables from .env if the file exists
	const envFilePath = path.join(__dirname, '.env');
	if (fs.existsSync(envFilePath)) {
		delete process.env.API_MANAGER; // Otherwise it is not overwritten
		envLoader.config({ path: envFilePath });
	}
	// Delete the cached module 
	decache('../config/axway-api-utils.default.js');
	process.env.ANM_URL = 'https://mocked-api-gateway:8190';
	process.env.ANM_USERNAME = 'admin';
	process.env.ANM_PASSWORD = 'changeme';
	
	var pluginConfig = require('../config/axway-api-utils.default.js').pluginConfig['api-builder-plugin-axway-api-management'];
	// Set a cache, which should be used instead by the Flow-Node.
	pluginConfig.testCache = testCache;

	beforeEach(async () => {
		nock('https://mocked-api-gateway:8190').post('/api/rbac/login').reply(303, [], { 'set-cookie': 'VIDUSR=1636962018-Ip/kbTlYhOpDbA==;' });
		plugin = await MockRuntime.loadPlugin(getPlugin, pluginConfig);
		plugin.setOptions({ validateOutputs: true });
		flowNode = plugin.getFlowNode('axway-api-management');
	});

	describe('#lookupTopology', () => {
		it('should result into the API-Gateway topology', async () => {
			nock('https://mocked-api-gateway:8190').get('/api/topology').replyWithFile(200, './test/testReplies/anm/topology/gatewayTopology.json');

			const { value, output } = await flowNode.lookupTopology();
			expect(value.emtEnabled).to.equal(true);
			expect(value.services).to.lengthOf(3); // We expect only 3 services, as the ANM is removed already
			expect(output).to.equal('next');
		});
	});

	describe('#getMetricsGroups', () => { 
		it('should error when missing parameter topology', async function () {
			const { value, output } = await flowNode.getMetricsGroups({ topology: null });

			expect(output).to.equal('error');
			expect(value).to.be.instanceOf(Object)
				.and.to.have.property('message', 'Missing required parameter: topology');
		});

		it('should return the Metrics-Groups', async () => {
			nock('https://mocked-api-gateway:8190').get('/api/router/service/apimgr/api/monitoring/metrics/groups').replyWithFile(200, './test/testReplies/anm/metrics/Groups/3_ApiMgrMetricsGroups.json');
			nock('https://mocked-api-gateway:8190').get('/api/router/service/instance-1/api/monitoring/metrics/groups').replyWithFile(200, './test/testReplies/anm/metrics/Groups/1_MetricsGroups.json');
			nock('https://mocked-api-gateway:8190').get('/api/router/service/instance-2/api/monitoring/metrics/groups').replyWithFile(200, './test/testReplies/anm/metrics/Groups/2_MetricsGroups.json');
			var testTopology = JSON.parse(fs.readFileSync('./test/testFiles/testTopology.json'), null);

			const { value, output } = await flowNode.getMetricsGroups({ topology: testTopology });
			expect(value).to.have.property('instance-1');
			expect(value).to.have.property('instance-2');
			expect(output).to.equal('next');
		});
	});

	describe('#getTimelineMetrics', () => {
		var serviceMetricTypes = "&metricType=successes&metricType=failures&metricType=exceptions&metricType=numMessages&metricType=processingTimeAvg&metricType=processingTimeMin&metricType=processingTimeMax";
		it('should error when missing parameter topology', async function () {
			const { value, output } = await flowNode.getTimelineMetrics({ topology: null });

			expect(output).to.equal('error');
			expect(value).to.be.instanceOf(Object)
				.and.to.have.property('message', 'Missing required parameter: topology');
		});

		it('should error when missing parameter metricsGroups', async function () {
			const { value, output } = await flowNode.getTimelineMetrics({ topology: {}, metricsGroups: null });

			expect(output).to.equal('error');
			expect(value).to.be.instanceOf(Object)
				.and.to.have.property('message', 'Missing required parameter: metricsGroups');
		});

		it('should error when missing parameter metricsType', async function () {
			const { value, output } = await flowNode.getTimelineMetrics({ topology: {}, metricsGroups: {}, metricsType: null });

			expect(output).to.equal('error');
			expect(value).to.be.instanceOf(Object)
				.and.to.have.property('message', 'Missing required parameter: metricsType');
		});

		it('should result into service metrics based on the timeline metrics', async () => {
			nock('https://mocked-api-gateway:8190').get(`/api/router/service/instance-1/api/monitoring/metrics/timeline?timeline=10m&metricGroupType=Service&name=Greeting%20API${serviceMetricTypes}`)
				.replyWithFile(200, './test/testReplies/anm/metrics/Timeline/1_ServiceTimeLine.json');
			nock('https://mocked-api-gateway:8190').get(`/api/router/service/instance-1/api/monitoring/metrics/timeline?timeline=10m&metricGroupType=Service&name=Petstore${serviceMetricTypes}`)
				.replyWithFile(200, './test/testReplies/anm/metrics/Timeline/2_ServiceTimeLine.json');
			nock('https://mocked-api-gateway:8190').get(`/api/router/service/instance-2/api/monitoring/metrics/timeline?timeline=10m&metricGroupType=Service&name=FHIR%20CarePlan${serviceMetricTypes}`)
				.replyWithFile(200, './test/testReplies/anm/metrics/Timeline/3_ServiceTimeLine.json');
			nock('https://mocked-api-gateway:8190').get(`/api/router/service/instance-2/api/monitoring/metrics/timeline?timeline=10m&metricGroupType=Service&name=EMR-DiagnosticInfo${serviceMetricTypes}`)
				.replyWithFile(200, './test/testReplies/anm/metrics/Timeline/4_ServiceTimeLine.json');

			var testTopology = JSON.parse(fs.readFileSync('./test/testFiles/testTopology.json'), null);
			var instance1Groups = JSON.parse(fs.readFileSync('./test/testReplies/anm/metrics/Groups/1_MetricsGroups.json'), null);
			var instance2Groups = JSON.parse(fs.readFileSync('./test/testReplies/anm/metrics/Groups/2_MetricsGroups.json'), null);
			var testGroups = { "instance-1": instance1Groups.result, "instance-2": instance2Groups.result }
			// Initially only the last data point is expected for all series as the cache is not yet populated
			const { value, output } = await flowNode.getTimelineMetrics({ topology: testTopology, metricsGroups: testGroups, metricsType: 'Service' });
			
			// We expect a simple array of metrics for each API-Gateway-Instance, Service and (later Method)
			expect(value).to.lengthOf(4); // 4 Service metrics are expected
			expect(output).to.equal('next');
			expect(value[0].successes).to.equal(788);
			expect(value[0].failures).to.equal(5);
			expect(value[1].successes).to.equal(888);
			expect(value[1].failures).to.equal(4);
		});

		it('should result into service metrics based on the timeline metrics', async () => {
			nock('https://mocked-api-gateway:8190').get(`/api/router/service/instance-1/api/monitoring/metrics/timeline?timeline=10m&metricGroupType=Service&name=Greeting%20API${serviceMetricTypes}`)
				.replyWithFile(200, './test/testReplies/anm/metrics/Timeline/1_ServiceTimeLine.json');
			nock('https://mocked-api-gateway:8190').get(`/api/router/service/instance-1/api/monitoring/metrics/timeline?timeline=10m&metricGroupType=Service&name=Petstore${serviceMetricTypes}`)
				.replyWithFile(200, './test/testReplies/anm/metrics/Timeline/2_ServiceTimeLine.json');
			nock('https://mocked-api-gateway:8190').get(`/api/router/service/instance-2/api/monitoring/metrics/timeline?timeline=10m&metricGroupType=Service&name=FHIR%20CarePlan${serviceMetricTypes}`)
				.replyWithFile(200, './test/testReplies/anm/metrics/Timeline/3_ServiceTimeLine.json');
			nock('https://mocked-api-gateway:8190').get(`/api/router/service/instance-2/api/monitoring/metrics/timeline?timeline=10m&metricGroupType=Service&name=EMR-DiagnosticInfo${serviceMetricTypes}`)
				.replyWithFile(200, './test/testReplies/anm/metrics/Timeline/4_ServiceTimeLine.json');

			// Simulate there is already a lastTimestampRead for both API-Gateway instances
			// MockedData calculated pointEnd: 1637752710000 based on pointStart: 1637752110000 (plus 10 minutes)
			// Simulate lastTimestampRead to force code to read last 5 data points: 1637752710000 - (5000 * 5) = 1637752685000
			testCache.set("instance-1", "1637752685000");
			testCache.set("instance-2", "1637752685000");

			var testTopology = JSON.parse(fs.readFileSync('./test/testFiles/testTopology.json'), null);
			var instance1Groups = JSON.parse(fs.readFileSync('./test/testReplies/anm/metrics/Groups/1_MetricsGroups.json'), null);
			var instance2Groups = JSON.parse(fs.readFileSync('./test/testReplies/anm/metrics/Groups/2_MetricsGroups.json'), null);
			var testGroups = { "instance-1": instance1Groups.result, "instance-2": instance2Groups.result }
			
			const { value, output } = await flowNode.getTimelineMetrics({ topology: testTopology, metricsGroups: testGroups, metricsType: 'Service' });
			
			// We expect a simple array of metrics for each API-Gateway-Instance, Service and (later Method)
			expect(value).to.lengthOf(4); // 4 Service metrics are expected
			expect(output).to.equal('next');
			
			expect(value[0].successes).to.equal(2078); // Last 5 datapoints: 788, 533, 355, 400, 2 = 2.078
			expect(value[0].failures).to.equal(30);
			expect(value[0].groupName).to.equal('Greeting API');
			expect(value[0].name).to.equal('Greeting API');
			expect(value[1].successes).to.equal(888);
			expect(value[1].failures).to.equal(4);
			expect(value[1].groupName).to.equal('Petstore');
			expect(value[1].name).to.equal('Petstore');
			// Mocked Timeline data for Instance-2 contains that information
			expect(value[2]).to.have.property('processingTimeMin');
			expect(value[2].processingTimeMin).to.not.be.null;
			expect(value[2]).to.have.property('processingTimeMax'); 
			expect(value[2].processingTimeMax).to.not.equal(null);
			expect(value[2]).to.have.property('processingTimeAvg'); 
			expect(value[2].processingTimeAvg).to.not.equal(null);
			expect(value[2]).to.have.property('numMessages');
			expect(value[2].numMessages).to.not.equal(null);
			//console.log(JSON.stringify(value));
		});
	});
});
