const https = require('https');

async function sendRequest(url, options, data, expectedRC) {
	return new Promise((resolve, reject) => {
		try {
			options.path = encodeURI(options.path);
			var req = https.request(url, options, function (response) {
				var chunks = [];
				var statusCode = response.statusCode;
				response.on("data", function (chunk) {
					chunks.push(chunk);
				});

				response.on("end", function () {
					var body = Buffer.concat(chunks);
					if (statusCode < 200 || statusCode > 299 && statusCode!=expectedRC) {
						reject({message: `Unexpected response for HTTP-Request. Response: ${body.toString()}`, statusCode: statusCode });
						return;
                    }
					const userResponse = body.toString();
					if (!userResponse) {
						resolve({body: userResponse, headers: response.headers });
						return;
					}
					resolve({body: JSON.parse(userResponse), headers: response.headers });
					return;
				});
			});
			req.on("error", function (error) {
				reject(error);
				return;
            });
            if(data) {
                req.write(data);
            }
			req.end();
		} catch (ex) {
			reject(ex);
		}
	});
}

async function loginToAdminNodeManager(anmConfig, options) {
	try {
		options.logger.debug(`Login to Admin-Node-Manager on URL: '${anmConfig.url}'`)
		var data = `username=${anmConfig.username}&password=${anmConfig.password}`;
		var reqOptions = {
			path: `/api/rbac/login`,
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': data.length
			},
			agent: new https.Agent({ rejectUnauthorized: false })
		};
		const result = await sendRequest(anmConfig.url, reqOptions, data, 303)
			.then(response => {
				return response;
			})
			.catch(err => {
				throw new Error(`Cannot login to Admin-Node-Manager on: '${anmConfig.url}'. Got error: ${JSON.stringify(err)}`);
			});
		const cookies = _getCookies(result.headers);
		options.logger.info(`Successully logged into Admin-Node-Manager on: '${anmConfig.url}'`);
		result.headers.Cookie = cookies;
		// Store all received headers and send them for further requests, incl. the required CSRF-Header and potentially create Load-Balancer Headers/Cookies
		anmConfig.requestHeaders = result.headers;
		return;
	} catch (ex) {
		options.logger.error(ex);
		throw ex;
	}
}

function _getCookies(headers) {
    const receivedCookies = headers['set-cookie'];
	var parsedCookies = "";
	var semicolon = "";
	for (var i = 0; i < receivedCookies.length; ++i) {
        var receivedCookie = receivedCookies[i].trim();
		var cookieName = receivedCookie.substring(0, receivedCookie.indexOf("="));
		var cookieValue = receivedCookie.substring(receivedCookie.indexOf("=")+1, receivedCookie.indexOf(";"));
		parsedCookies += `${semicolon}${cookieName}=${cookieValue}`
		semicolon = "; ";
	}
	return parsedCookies;
}

module.exports = {
    sendRequest,
	loginToAdminNodeManager
}