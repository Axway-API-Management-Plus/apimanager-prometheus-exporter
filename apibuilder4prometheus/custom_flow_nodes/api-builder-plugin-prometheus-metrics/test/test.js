const { expect } = require('chai');
const { MockRuntime } = require('@axway/api-builder-test-utils');
const getPlugin = require('../src');
const fs = require('fs');
const client = require('prom-client');

describe('flow-node prometheus-metrics', () => {
	let plugin;
	let flowNode;

	beforeEach(async () => {
		plugin = await MockRuntime.loadPlugin(getPlugin);
		plugin.setOptions({
			validateInputs: true,
			validateOutputs: true
		});
		flowNode = plugin.getFlowNode('prometheus-metrics');
	});

	describe('#constructor', () => {
		it('should define flow-nodes', () => {
			expect(plugin).to.be.a('object');
			expect(plugin.getFlowNodeIds()).to.deep.equal([
				'prometheus-metrics'
			]);
			expect(flowNode).to.be.a('object');
		});

		it('should define valid flow-nodes', () => {
			plugin.validate();
		});
	});

	describe('#processSummaryMetrics', () => {
		it('should error when missing required parameter', async () => {
			// Disable automatic input validation (we want the action to handle this)
			plugin.setOptions({ validateInputs: false });

			const { value, output } = await flowNode.processSummaryMetrics({
				summaryMetrics: null
			});

			expect(value).to.be.instanceOf(Error)
				.and.to.have.property('message', 'Missing required parameter summaryMetrics');
			expect(output).to.equal('error');
		});

		it('should collect all SystemOverview metrics from the given summary metrics', async () => {
			var testMetrics = JSON.parse(fs.readFileSync('./test/testFiles/Summary/1_SummaryTestMetrics.json'), null);
			
			const { value, output } = await flowNode.processSummaryMetrics({ summaryMetrics: testMetrics });
			expect(value).to.be.instanceOf(client.Registry);
			// Check some of the returned metrics
			var instanceCPUMetric = await value.getSingleMetric('axway_apigateway_instance_cpu').get();
			expect(instanceCPUMetric.type).to.equal('gauge');
			expect(instanceCPUMetric.values).to.lengthOf(2); // 2 API-Gateway instances
			expect(instanceCPUMetric.values).to.deep.equal(
				[ 
					{ labels: { gatewayId: 'instance-1'}, value: 0 },
					{ labels: { gatewayId: 'instance-2'}, value: 1 }
				]);
			expect(await value.getSingleMetric('axway_apigateway_instance_disk_used').get()).to.be.a('object');
			// As of now, SystemOverview is also used to get API-Requests information until this is fixed: https://support.axway.com/en/case-global/view/id/01314580
			var diskUsed = await value.getSingleMetric('axway_apigateway_instance_disk_used').get();
			var minMemory = await value.getSingleMetric('axway_apigateway_instance_memory_min').get();
			
			expect(diskUsed.values).to.lengthOf(2); 
			expect(diskUsed.values[0]).to.deep.equal( { labels: { 'gatewayId': 'instance-1'}, value: 26 });
			expect(diskUsed.values[1]).to.deep.equal( { labels: { 'gatewayId': 'instance-2'}, value: 55 });
			expect(minMemory.values).to.lengthOf(2); 
			expect(minMemory.values[0]).to.deep.equal( { labels: { 'gatewayId': 'instance-1'}, value: 956784 });
			expect(minMemory.values[1]).to.deep.equal( { labels: { 'gatewayId': 'instance-2'}, value: 1441080 });
			expect(output).to.equal('next');
		});
	});

	describe('#processServiceMetrics', () => {
		it('should error when missing required parameter', async () => {
			// Disable automatic input validation (we want the action to handle this)
			plugin.setOptions({ validateInputs: false });

			const { value, output } = await flowNode.processServiceMetrics({
				serviceMetrics: null
			});

			expect(value).to.be.instanceOf(Error)
				.and.to.have.property('message', 'Missing required parameter serviceMetrics');
			expect(output).to.equal('error');
		});

		it('should update the service registry based on the given service metrics', async () => {
			var testMetrics = JSON.parse(fs.readFileSync('./test/testFiles/Service/1_ServiceMetrics.json'), null);
			const { value, output } = await flowNode.processServiceMetrics({ serviceMetrics: testMetrics });

			expect(value).to.be.instanceOf(client.Registry);
			
			var apiRequestsTotal = await value.getSingleMetric('axway_api_requests_total').get();
			var apiRequestsSuccess = await value.getSingleMetric('axway_api_requests_success').get();
			var apiRequestsFailure = await value.getSingleMetric('axway_api_requests_failures').get();
			var apiRequestsExceptions = await value.getSingleMetric('axway_api_requests_exceptions').get();
			var apiRequestsDurationAvg = await value.getSingleMetric('axway_api_requests_duration_avg').get();
			var apiRequestsDurationMax = await value.getSingleMetric('axway_api_requests_duration_max').get();
			var apiRequestsDurationMin = await value.getSingleMetric('axway_api_requests_duration_min').get();
			
			
			expect(apiRequestsTotal.type).to.equal('counter');
			expect(apiRequestsTotal.values).to.lengthOf(4); // 4 Metrics are expected
			expect(apiRequestsSuccess.values[0]).to.deep.equal( { labels: { 'gatewayId': 'instance-1', "service": "Greeting API"}, value: 2078 });
			expect(apiRequestsFailure.values[0]).to.deep.equal( { labels: { 'gatewayId': 'instance-1', "service": "Greeting API"}, value: 30 });
			expect(apiRequestsExceptions.values[0]).to.deep.equal( { labels: { 'gatewayId': 'instance-1', "service": "Greeting API"}, value: 1 });

			expect(apiRequestsSuccess.values[1]).to.deep.equal( { labels: { 'gatewayId': 'instance-1', "service": "Petstore"}, value: 888 });
			expect(apiRequestsFailure.values[1]).to.deep.equal( { labels: { 'gatewayId': 'instance-1', "service": "Petstore"}, value: 4 });
			expect(apiRequestsExceptions.values[1]).to.deep.equal( { labels: { 'gatewayId': 'instance-1', "service": "Petstore"}, value: 1 });

			expect(apiRequestsSuccess.values[2]).to.deep.equal( { labels: { 'gatewayId': 'instance-2', "service": "FHIR CarePlan"}, value: 6 });
			expect(apiRequestsFailure.values[2]).to.deep.equal( { labels: { 'gatewayId': 'instance-2', "service": "FHIR CarePlan"}, value: 0 });
			expect(apiRequestsExceptions.values[2]).to.deep.equal( { labels: { 'gatewayId': 'instance-2', "service": "FHIR CarePlan"}, value: 0 });

			expect(apiRequestsDurationAvg.type).to.equal('histogram');
			expect(apiRequestsDurationMax.type).to.equal('histogram');
			expect(apiRequestsDurationMin.type).to.equal('histogram');

			// Check for the Petstore service, has some duration (processingTime) test values
			expect(output).to.equal('next');
		});
	});

	describe('#getMetrics', () => {
		var testRegistry = new client.Registry();

		// Register some dummy metrics, which can be validated in the merged registry
		var metric1 = new client.Gauge({registers: [], name: 'registry1_metric', help: 'A sample metric'});
		testRegistry.registerMetric(metric1);
		var metric2 = new client.Gauge({registers: [], name: 'registry2_metric', help: 'A sample metric'});
		testRegistry.registerMetric(metric2);
		var upMetric = new client.Gauge({registers: [], name: 'up', help: 'A sample metric'});
		testRegistry.registerMetric(upMetric);

		// Get plugin with a test registry
		beforeEach(async () => {
			debugger;
			plugin = await MockRuntime.loadPlugin(getPlugin, { registry: testRegistry });
			plugin.setOptions({
				validateInputs: true,
				validateOutputs: true
			});
			flowNode = plugin.getFlowNode('prometheus-metrics');
		});

		after(async () => {
			testRegistry.clear();
		});

		it('should return the metrics', async () => {
			const { value, output } = await flowNode.getMetrics();
			expect(value).to.be.instanceOf(client.Registry);

			expect(await value.getSingleMetric('registry1_metric').get()).to.be.a('object');
			expect(await value.getSingleMetric('registry2_metric').get()).to.be.a('object');
			expect(await value.getSingleMetric('up').get()).to.be.a('object');
			expect(output).to.equal('next');
		});
	});

	describe('#processTopologyInfo', () => {
		it('should error when missing required parameter', async () => {
			// Disable automatic input validation (we want the action to handle this)
			plugin.setOptions({ validateInputs: false });

			const { value, output } = await flowNode.processTopologyInfo({
				gatewayTopology: null
			});

			expect(value).to.be.instanceOf(Error)
				.and.to.have.property('message', 'Missing required parameter gatewayTopology');
			expect(output).to.equal('error');
		});

		it('should update the service registry based on the given topology', async () => {
			var testTopology = JSON.parse(fs.readFileSync('./test/testFiles/Topology/testTopology.json'), null);
			const { value, output } = await flowNode.processTopologyInfo({ gatewayTopology: testTopology });

			expect(value).to.be.instanceOf(client.Registry);
			
			var versionInfo = await value.getSingleMetric('axway_apigateway_version').get();

			expect(versionInfo.type).to.equal('gauge');
			expect(versionInfo.values).to.lengthOf(2); // 2 Metrics from two Gateway-Instances are expected
			expect(versionInfo.values[0]).to.deep.equal( { labels: { gatewayId: "instance-1", version: "7.7.20210330", image: "docker.pkg.github.com/cwiechmann/axway-api-management-automated/manager:77-20210330-v1-696cc6d"}, value: 1 });
			expect(output).to.equal('next');
		});
	});
});
