module.exports = {
	pluginConfig: {
		'api-builder-plugin-axway-api-management': {
			'adminNodeManager': {
				url: process.env.ANM_URL,
				username: process.env.ANM_USERNAME,
				password: process.env.ANM_PASSWORD 
			}
		}
	}
};
