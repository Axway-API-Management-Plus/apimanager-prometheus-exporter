FROM java:8-jre


EXPOSE 5044

# Copy your fat jar to the container
COPY target/prometheus-exporter-standalone.jar /opt/
# Launch the verticle
WORKDIR /opt
ENTRYPOINT ["sh", "-c"]
CMD ["exec java -jar prometheus-exporter-standalone.jar"]
