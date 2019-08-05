package com.axway.apim.prometheus.metric;

import com.axway.apim.prometheus.model.Message;
import com.axway.apim.prometheus.model.SystemMessage;

import io.prometheus.client.Gauge;

public class SystemMetricHandler extends MetricHandler {
	
	private final Gauge metricDiskUsed = Gauge.build()
	        .name("gateway_instance_disk_used")
	        .help("Percentage of disk used (disk on which the API Gateway instance is running: $VINSTDIR)")
	        .register();

	private final Gauge metricInstanceCpu = Gauge.build()
	        .name("gateway_instance_cpu")
	        .help("Percentage of current process CPU usage (total usage divided by the number of cores)")
	        .register();
	
	private final Gauge metricSystemCpu = Gauge.build()
	        .name("gateway_system_cpu")
	        .help("Percentage of the global CPU usage on the system")
	        .register();
	
	private final Gauge metricInstanceMemory = Gauge.build()
	        .name("gateway_instance_memory")
	        .help("Memory used by the API-Gateway instance JVM (in KB)")
	        .register();
	
	private final Gauge metricSystemMemory = Gauge.build()
	        .name("gateway_system_memory")
	        .help("System memory used (in KB)")
	        .register();
	
	private final Gauge metricSystemMemoryTotal = Gauge.build()
	        .name("gateway_system_memory_total")
	        .help("System total memory size (in KB).")
	        .register();

	public SystemMetricHandler() {
		super();
	}


	@Override
	public void process(Message msg) {
		SystemMessage my = (SystemMessage)msg;
		metricDiskUsed.set(new Double(my.getDiskUsed()));
		metricInstanceCpu.set(new Double(my.getInstCpu()));
		metricSystemCpu.set(new Double(my.getSysCpu()));
		metricInstanceMemory.set(new Double(my.getInstMem()));
		metricSystemMemory.set(new Double(my.getSysMem()));
		metricSystemMemoryTotal.set(new Double(my.getSysMemTotal()));
	}
}
