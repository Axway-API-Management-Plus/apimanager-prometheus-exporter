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

	describe('#processSystemMetrics', () => {
		it('should error when missing required parameter', async () => {
			plugin.setOptions({ validateInputs: false });

			const { value, output } = await flowNode.processSystemMetrics({
				systemMetrics: null
			});

			expect(value).to.be.instanceOf(Error)
				.and.to.have.property('message', 'Missing required parameter systemMetrics');
			expect(output).to.equal('error');
		});

		it('should collect all System metrics from the given system metrics', async () => {
			var testMetrics = JSON.parse(fs.readFileSync('./test/testFiles/System/1_SystemMetrics.json'), null);
			
			const { value, output } = await flowNode.processSystemMetrics({ systemMetrics: testMetrics });
			expect(value).to.be.instanceOf(client.Registry);
			// Check some of the returned metrics
			var instanceCPUMetric = await value.getSingleMetric('axway_apigateway_instance_cpu_ratio').get();
			var systemCPUMetric = await value.getSingleMetric('axway_apigateway_system_cpu_ratio').get();
			expect(instanceCPUMetric.type).to.equal('gauge');
			expect(instanceCPUMetric.values).to.lengthOf(2); // 2 API-Gateway instances
			expect(instanceCPUMetric.values).to.deep.equal(
				[ 
					{ labels: { gatewayId: 'instance-1'}, value: 4 },
					{ labels: { gatewayId: 'instance-2'}, value: 2 }
				]);
			expect(systemCPUMetric.values).to.deep.equal(
					[ 
						{ labels: { gatewayId: 'instance-1'}, value: 8 },
						{ labels: { gatewayId: 'instance-2'}, value: 9 }
					]);
			// As of now, SystemOverview is also used to get API-Requests information until this is fixed: https://support.axway.com/en/case-global/view/id/01314580
			var diskUsed = await value.getSingleMetric('axway_apigateway_instance_disk_used_ratio').get();
			var memUsed = await value.getSingleMetric('axway_apigateway_memory_used_bytes').get();
			var systemMemTotal = await value.getSingleMetric('axway_apigateway_system_memory_total_bytes').get();
			var systemMemUsed = await value.getSingleMetric('axway_apigateway_system_memory_used_bytes').get();

			expect(diskUsed).to.be.a('object');
			expect(diskUsed.values).to.lengthOf(2); 
			expect(diskUsed.values[0]).to.deep.equal( { labels: { 'gatewayId': 'instance-1'}, value: 24 });
			expect(diskUsed.values[1]).to.deep.equal( { labels: { 'gatewayId': 'instance-2'}, value: 26 });
			expect(memUsed.values).to.lengthOf(2); 
			expect(memUsed.values[0]).to.deep.equal( { labels: { 'gatewayId': 'instance-1'}, value: 1025604000 });
			expect(memUsed.values[1]).to.deep.equal( { labels: { 'gatewayId': 'instance-2'}, value: 1015604000 });
			expect(systemMemTotal.values).to.lengthOf(2); 
			expect(systemMemTotal.values[0]).to.deep.equal( { labels: { 'gatewayId': 'instance-1'}, value: 31314446000 });
			expect(systemMemTotal.values[1]).to.deep.equal( { labels: { 'gatewayId': 'instance-2'}, value: 32410868000 });
			expect(systemMemUsed.values).to.lengthOf(2); 
			expect(systemMemUsed.values[0]).to.deep.equal( { labels: { 'gatewayId': 'instance-1'}, value: 30766226000 });
			expect(systemMemUsed.values[1]).to.deep.equal( { labels: { 'gatewayId': 'instance-2'}, value: 30096188000 });
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
			var apiRequestsDuration = await value.getSingleMetric('axway_api_requests_duration_seconds').get();
			
			
			expect(apiRequestsTotal.type).to.equal('counter');
			expect(apiRequestsTotal.values).to.lengthOf(4); // 4 Metrics are expected
			expect(apiRequestsSuccess.values[0]).to.deep.equal( { labels: { 'gatewayId': 'instance-1', "service": "Greeting API"}, value: 2078 });
			expect(apiRequestsFailure.values[0]).to.deep.equal( { labels: { 'gatewayId': 'instance-1', "service": "Greeting API"}, value: 30 });
			expect(apiRequestsExceptions.values[0]).to.deep.equal( { labels: { 'gatewayId': 'instance-1', "service": "Greeting API"}, value: 0 });

			expect(apiRequestsSuccess.values[1]).to.deep.equal( { labels: { 'gatewayId': 'instance-1', "service": "Petstore"}, value: 888 });
			expect(apiRequestsFailure.values[1]).to.deep.equal( { labels: { 'gatewayId': 'instance-1', "service": "Petstore"}, value: 4 });
			expect(apiRequestsExceptions.values[1]).to.deep.equal( { labels: { 'gatewayId': 'instance-1', "service": "Petstore"}, value: 1 });

			expect(apiRequestsSuccess.values[2]).to.deep.equal( { labels: { 'gatewayId': 'instance-2', "service": "FHIR CarePlan"}, value: 6 });
			expect(apiRequestsFailure.values[2]).to.deep.equal( { labels: { 'gatewayId': 'instance-2', "service": "FHIR CarePlan"}, value: 0 });
			expect(apiRequestsExceptions.values[2]).to.deep.equal( { labels: { 'gatewayId': 'instance-2', "service": "FHIR CarePlan"}, value: 0 });

			expect(apiRequestsDuration.type).to.equal('histogram');
			expect(apiRequestsDuration.type).to.equal('histogram');
			expect(apiRequestsDuration.type).to.equal('histogram');

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

		it('should update the service registry based on the given topology and in the second call remove a stopped API-Gateway', async () => {
			var testTopology = JSON.parse(fs.readFileSync('./test/testFiles/Topology/testTopology.json'), null);
			var { value, output } = await flowNode.processTopologyInfo({ gatewayTopology: testTopology });

			expect(value).to.be.instanceOf(client.Registry);
			
			var versionInfo = await value.getSingleMetric('axway_apigateway_version_info').get();

			expect(versionInfo.type).to.equal('gauge');
			expect(versionInfo.values).to.lengthOf(2); // 2 Metrics from two Gateway-Instances are expected
			expect(versionInfo.values[0]).to.deep.equal( { labels: { gatewayId: "instance-1", version: "7.7.20210330", image: "docker.pkg.github.com/cwiechmann/axway-api-management-automated/manager:77-20210330-v1-696cc6d"}, value: 1 });
			expect(versionInfo.values[1]).to.deep.equal( { labels: { gatewayId: "instance-2", version: "7.7.20210330", image: "docker.pkg.github.com/cwiechmann/axway-api-management-automated/manager:77-20210330-v1-696cc6d"}, value: 1 });
			expect(output).to.equal('next');

			var changedTopology = JSON.parse(fs.readFileSync('./test/testFiles/Topology/changedTopology.json'), null);

			var result = await flowNode.processTopologyInfo({ gatewayTopology: changedTopology });

			var versionInfo = await result.value.getSingleMetric('axway_apigateway_version_info').get();
			expect(versionInfo.values[0]).to.deep.equal( { labels: { gatewayId: "instance-1", version: "7.7.20210330", image: "docker.pkg.github.com/cwiechmann/axway-api-management-automated/manager:77-20210330-v1-696cc6d"}, value: 1 });
			expect(versionInfo.values[1]).to.deep.equal( { labels: { gatewayId: "instance-3", version: "7.7.20210330", image: "docker.pkg.github.com/cwiechmann/axway-api-management-automated/manager:77-20210330-v1-696cc6d"}, value: 1 });
		});

		it('should update the service registry based on the given topology that contains an offline gateway instance', async () => {
			debugger;
			var testTopology = JSON.parse(fs.readFileSync('./test/testFiles/Topology/topology1GatewayDown.json'), null);
			var { value, output } = await flowNode.processTopologyInfo({ gatewayTopology: testTopology });

			expect(value).to.be.instanceOf(client.Registry);
			
			var versionInfo = await value.getSingleMetric('axway_apigateway_version_info').get();

			expect(versionInfo.type).to.equal('gauge');
			expect(versionInfo.values).to.lengthOf(2); // 2 Metrics from two Gateway-Instances are expected, but one is down
			expect(versionInfo.values[0]).to.deep.equal( { labels: { gatewayId: "instance-1", version: "7.7.20210330", image: "docker.pkg.github.com/cwiechmann/axway-api-management-automated/manager:77-20210330-v1-696cc6d"}, value: 0 });
			expect(versionInfo.values[1]).to.deep.equal( { labels: { gatewayId: "instance-2", version: "7.7.20210330", image: "docker.pkg.github.com/cwiechmann/axway-api-management-automated/manager:77-20210330-v1-696cc6d"}, value: 1 });
			expect(output).to.equal('next');
		});
	});
});
