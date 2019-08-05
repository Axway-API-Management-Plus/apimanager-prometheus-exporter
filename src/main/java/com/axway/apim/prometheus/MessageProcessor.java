package com.axway.apim.prometheus;

import java.util.Map;

import org.apache.camel.Exchange;
import org.apache.camel.Processor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.axway.apim.prometheus.metric.HeaderMetricHandler;
import com.axway.apim.prometheus.metric.MetricHandler;
import com.axway.apim.prometheus.metric.SystemMetricHandler;
import com.axway.apim.prometheus.metric.TransactionMetricHandler;
import com.axway.apim.prometheus.model.HeaderMessage;
import com.axway.apim.prometheus.model.Message;
import com.axway.apim.prometheus.model.SystemMessage;
import com.axway.apim.prometheus.model.TransactionMessage;
import com.fasterxml.jackson.databind.ObjectMapper;

public class MessageProcessor implements Processor {
	static Logger LOG = LoggerFactory.getLogger(MessageProcessor.class);
	
	TransactionMetricHandler transactionHandler = null;
	SystemMetricHandler systemHandler = null;
	HeaderMetricHandler headerHandler = null;

	public MessageProcessor() {
		super();
		transactionHandler = new TransactionMetricHandler();
		systemHandler = new SystemMetricHandler();
		headerHandler = new HeaderMetricHandler();
	}

	@SuppressWarnings("unchecked")
	@Override
	public void process(Exchange exchange) throws Exception {
		Map<Object, Object> body = exchange.getIn().getBody(Map.class);
		String receivedMessage = (String)body.get("message");
		LOG.info("Received message: '"+receivedMessage+"'");
		Message msg = processMessage(receivedMessage);
	}
	
	public Message processMessage(String message) throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		Message msg = null;
		MetricHandler handler = null;
		if(message.contains("\"type\":\"system\"")) {
			msg = mapper.readValue(message, SystemMessage.class);
			handler = systemHandler;
		} else if(message.contains("\"type\":\"transaction\"")) {
			msg = mapper.readValue(message, TransactionMessage.class);
			handler = transactionHandler;
		} else if(message.contains("\"type\":\"header\"")) {
			msg = mapper.readValue(message, HeaderMessage.class);
			handler = headerHandler;
		} else {
			LOG.error("Unsupported message type: " + message);
			return null;
		}
		if(handler.isBlackListed(msg)) return msg;
		handler.process(msg);
		return msg;
	}

}
