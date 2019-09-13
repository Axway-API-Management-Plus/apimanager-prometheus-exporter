package com.axway.apim.prometheus.model;

public class SystemMessage extends Message {
	
	private String time;
	
	private String diskUsed;
	
	private String instCpu;
	
	private String sysCpu;
	
	private String instMem;
	
	private String sysMem;
	
	private String sysMemTotal;

	public SystemMessage() {
		super();
	}

	public String getTime() {
		return time;
	}

	public void setTime(String time) {
		this.time = time;
	}

	public String getDiskUsed() {
		return diskUsed;
	}

	public void setDiskUsed(String diskUsed) {
		this.diskUsed = diskUsed;
	}

	public String getInstCpu() {
		return instCpu;
	}

	public void setInstCpu(String instCpu) {
		this.instCpu = instCpu;
	}

	public String getSysCpu() {
		return sysCpu;
	}

	public void setSysCpu(String sysCpu) {
		this.sysCpu = sysCpu;
	}

	public String getInstMem() {
		return instMem;
	}

	public void setInstMem(String instMem) {
		this.instMem = instMem;
	}

	public String getSysMem() {
		return sysMem;
	}

	public void setSysMem(String sysMem) {
		this.sysMem = sysMem;
	}

	public String getSysMemTotal() {
		return sysMemTotal;
	}

	public void setSysMemTotal(String sysMemTotal) {
		this.sysMemTotal = sysMemTotal;
	}
}
