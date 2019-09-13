#!/bin/sh

if [ -z "$JAVA_HOME" ]
then
        echo Environment variable JAVA_HOME not set!
        exit 1
fi

#programDir="${0%/*}"
programDir="$( cd "$(dirname "$0")" ; pwd -P )"

cd $programDir/..

CP=lib:conf
for jars in lib/*
do
        CP=$CP:$jars
done

echo ""

"$JAVA_HOME/bin/java" -Xms64m -Xmx256m -classpath "$CP" com.axway.apim.prometheus.ExporterMain "${@}"
rc=$?
exit $rc
