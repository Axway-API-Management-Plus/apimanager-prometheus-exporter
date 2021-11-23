const { expect } = require('chai');
const { MockRuntime } = require('@axway/api-builder-test-utils');
const getPlugin = require('../src');
const path = require('path');
const fs = require('fs');
const nock = require('nock');
const envLoader = require('dotenv');
const decache = require('decache');

describe('Tests Topology-Lookup', () => {
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
	
	//nock('https://mocked-api-gateway:8190').post('/api/rbac/login').reply(303, [], { 'set-cookie': 'VIDUSR=1636962018-Ip/kbTlYhOpDbA==;' });
	var pluginConfig = require('../config/axway-api-utils.default.js').pluginConfig['api-builder-plugin-axway-api-management'];
	

	beforeEach(async () => {
		nock('https://mocked-api-gateway:8190').post('/api/rbac/login').reply(303, [], { 'set-cookie': 'VIDUSR=1636962018-Ip/kbTlYhOpDbA==;' });
		plugin = await MockRuntime.loadPlugin(getPlugin, pluginConfig);
		plugin.setOptions({ validateOutputs: true });
		flowNode = plugin.getFlowNode('axway-api-management');
	});

	describe('#lookupTopology', () => {
		it('should result into the API-Gateway topology', async () => {
			nock('https://mocked-api-gateway:8190').get('/api/topology').replyWithFile(200, './test/testReplies/anm/topology/gatewayEMTTopology.json');

			const { value, output } = await flowNode.lookupTopology();
			expect(value.emtEnabled).to.equal(true);
			expect(value.services).to.lengthOf(3); // We expect only 3 services, as the ANM is removed already
			expect(output).to.equal('next');
		});
	});

	describe('#getMetrics', () => {
		it('should error when missing parameter topology', async function () {
			const { value, output } = await flowNode.getMetrics({ topology: null });

			expect(output).to.equal('error');
			expect(value).to.be.instanceOf(Object)
				.and.to.have.property('message', 'Missing required parameter: topology');
		});

		it('should error when missing parameter metricType', async function () {
			const { value, output } = await flowNode.getMetrics({ topology: {}, metricsType: null });

			expect(output).to.equal('error');
			expect(value).to.be.instanceOf(Object)
				.and.to.have.property('message', 'Missing required parameter: metricsType');
		});
	});

	describe('#getSystemOverviewMetrics', () => {
		it('should return SystemOverview metrics object from all API-Gateway instances', async () => {
			var testTopology = JSON.parse(fs.readFileSync('./test/testConfig/testTopology.json'), null);
			const metricsFolder = './test/testReplies/anm/metrics/SystemOverview';

			nock('https://mocked-api-gateway:8190').get('/api/router/service/apimgr-6c9876cb48-g4sdq/api/monitoring/metrics/summary?timeline=10minutes&metricGroupType=SystemOverview').replyWithFile(200, metricsFolder+'/metricsSummary10Minutes-apimgr-6c9876cb48-g4sdq.json');
			nock('https://mocked-api-gateway:8190').get('/api/router/service/traffic-7cb4f6989f-bjw8n/api/monitoring/metrics/summary?timeline=10minutes&metricGroupType=SystemOverview').replyWithFile(200, metricsFolder+'/metricsSummary10Minutes-traffic-7cb4f6989f-bjw8n.json');
			nock('https://mocked-api-gateway:8190').get('/api/router/service/traffic-7cb4f6989f-jbmf7/api/monitoring/metrics/summary?timeline=10minutes&metricGroupType=SystemOverview').replyWithFile(200, metricsFolder+'/metricsSummary10Minutes-traffic-7cb4f6989f-jbmf7.json');

			const { value, output } = await flowNode.getMetrics({ topology: testTopology, metricsType: "SystemOverview" });
			expect(value).to.lengthOf(3); // 3 API-Gateway instances are expected (Perhaps later, remove the API-Manager service by a config option)
			expect(value[0].gatewayId).to.equal('apimgr-6c9876cb48-g4sdq');
			expect(value[1].gatewayId).to.equal('traffic-7cb4f6989f-bjw8n');
			expect(value[2].gatewayId).to.equal('traffic-7cb4f6989f-jbmf7');
			expect(output).to.equal('next');
		});
	});

	describe('#getServicesMetrics', () => {
		it.only('should return Services metrics object from all API-Gateway instances', async () => {
			var testTopology = JSON.parse(fs.readFileSync('./test/testFiles/testTopology.json'), null);
			var expectedServiceMetrics = JSON.parse(fs.readFileSync('./test/testFiles/ExpectedServiceMetrics.json'), null);
			const metricsFolder = './test/testReplies/anm/metrics/Service';

			nock('https://mocked-api-gateway:8190').get('/api/router/service/apimgr-6c9876cb48-g4sdq/api/monitoring/metrics/summary?timeline=10minutes&metricGroupType=Service').replyWithFile(200, metricsFolder+'/metricsSummary10Minutes-apimgr-6c9876cb48-g4sdq.json');
			nock('https://mocked-api-gateway:8190').get('/api/router/service/traffic-7cb4f6989f-bjw8n/api/monitoring/metrics/summary?timeline=10minutes&metricGroupType=Service').replyWithFile(200, metricsFolder+'/metricsSummary10Minutes-traffic-7cb4f6989f-bjw8n.json');
			nock('https://mocked-api-gateway:8190').get('/api/router/service/traffic-7cb4f6989f-jbmf7/api/monitoring/metrics/summary?timeline=10minutes&metricGroupType=Service').replyWithFile(200, metricsFolder+'/metricsSummary10Minutes-traffic-7cb4f6989f-jbmf7.json');

			const { value, output } = await flowNode.getMetrics({ topology: testTopology, metricsType: "Service" });
			expect(value).to.lengthOf(13); 
			expect(value).to.deep.equal(expectedServiceMetrics);
			expect(output).to.equal('next');
		});
	});
});
