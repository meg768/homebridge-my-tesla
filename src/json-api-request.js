
module.exports = function Request() {

	var Path = require('path');
	var URL = require('url');
	var self = this;

	function debug() {
	};

	function isString(arg) {
		return typeof arg == 'string';
	};
	
	function isObject(arg) {
		return typeof arg == 'object' && arg != null;
	};
	
	function isFunction(arg) {
		return typeof arg === 'function';
	};

	function constructor() {

		var options = {protocol:'https:'};

		if (isObject(arguments[0])) {
			Object.assign(options, arguments[0]);
		}

		else if (isString(arguments[0])) {
			var url = new URL.parse(arguments[0]);

			if (url.protocol != undefined)
				options.protocol = url.protocol;

			if (url.port != undefined)
				options.port = url.port;

			if (url.hostname != undefined)
				options.hostname = url.hostname;

			if (url.path != undefined)
				options.path = url.path;

			if (isObject(arguments[1]))
				Object.assign(options, arguments[1]);

		}

		if (options.debug) {
            debug = isFunction(options.debug) ? options.debug : console.log;
        }

		self.defaultOptions = Object.assign({}, options);

		debug('Default options', self.defaultOptions);
	}

	this.get = function() {
		return self.request.apply(self, ['GET'].concat(Array.prototype.slice.call(arguments)));
	}

	this.delete = function() {
		return self.request.apply(self, ['DELETE'].concat(Array.prototype.slice.call(arguments)));
	}

	this.post = function() {
		return self.request.apply(self, ['POST'].concat(Array.prototype.slice.call(arguments)));
	}

	this.put = function() {
		return self.request.apply(self, ['PUT'].concat(Array.prototype.slice.call(arguments)));
	}

	this.request = function() {

		debug('Request arguments:', arguments);

		var self    = this;
		var https   = require('https');
		var http    = require('http');
		var options = {};

		if (isString(arguments[0])) {
			if (isString(arguments[1])) {
				options.method = arguments[0];
				options.path   = arguments[1];

				Object.assign(options, arguments[2]);
			}
			else {
				options.method = arguments[0];
				Object.assign(options, arguments[1]);
			}
		}
		else if (isObject(arguments[0])) {
			options = arguments[0];
		}
		else {
			return Promise.reject('Missing options.');
		}

		debug('Request options:', options);
		
	    return new Promise(function(resolve, reject) {
			var data = isObject(options.body) ? JSON.stringify(options.body) : options.body;
			var headers = {};

			if (self.defaultOptions.headers != undefined) {
				for (var key in self.defaultOptions.headers) {
					headers[key.toLowerCase()] = self.defaultOptions.headers[key];
				}

			}

			if (options.headers != undefined) {
				for (var key in options.headers) {
					headers[key.toLowerCase()] = options.headers[key];
				}

			}

			// If default options includes a path, join the two
			if (isString(self.defaultOptions.path) && isString(options.path)) {
				options.path = Path.join(self.defaultOptions.path, options.path);
			}

			headers['content-length'] = data == undefined ? 0 : Buffer.from(data).length;

			if (isObject(options.body)) 
				headers['content-type'] = 'application/json;charset=utf-8';

			var params = {};
			Object.assign(params, self.defaultOptions, options, {headers:headers});

			var iface = params.protocol === "https:" ? https : http;

			debug('Request params:', params);

	        var request = iface.request(params, function(response) {

				response.setEncoding('utf8');				

				var body = [];

				response.on('data', function(chunk) {
					body.push(chunk);
				});

	            response.on('end', function() {
	                body = body.join('');

					var contentType = '';

					if (response.headers && isString(response.headers['content-type'])) {
						contentType = response.headers['content-type'];
					}

					if (contentType.match("application/json")) {
						try {
							body = JSON.parse(body);
		                }
						catch (error) {
		                }
					}

	                var reply = {
	                    statusCode     : response.statusCode,
	                    statusMessage  : response.statusMessage,
	                    headers        : response.headers,
	                    body           : body
	                };

	                resolve(reply);
	            })
	        });

	        if (data) {
	            request.write(data);
	        }

			request.on('error', function(error) {
				reject(error);
			});

	        request.end();
	    })
	};


	constructor.apply(self, arguments);
}
