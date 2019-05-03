
var querystring  = require('querystring');
var Path         = require('path');
var URL          = require('url');

var isString    = require('yow/is').isString;
var isObject    = require('yow/is').isObject;
var isFunction  = require('yow/is').isFunction;

function debug() {
};


function Gopher() {

	var self = this;

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

			headers['content-length'] = data == undefined ? 0 : Buffer.from(data).length;

			if (isObject(options.body)) 
				headers['content-type'] = 'application/json;charset=utf-8';

			var params = {};
			Object.assign(params, self.defaultOptions, options, {headers:headers});

			if (isString(params.path) && isObject(params.params)) {
				var parts = [];

				params.path.split('/').forEach(function(part) {
					var match = part.match('^:([_$@A-Za-z0-9]+)$');

					if (!match)
						match = part.match('^{([_$@A-Za-z0-9]+)}$');

					if (match) {
						var name = match[1];

						if (params.params[name] != undefined) {
							parts.push(params.params[name]);
						}
						else
							parts.push(part);
					}
					else
						parts.push(part);

				});

				params.path = parts.join('/');
			}

			if (isObject(params.query)) {
				params.query = querystring.stringify(params.query);
			}

			if (isString(params.query) && params.query.length > 0) {
				params.path = Path.join(params.path, '?' + params.query);
			}


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
console.log(body);
					if (contentType.match("application/json")) {
						try {
							body = JSON.parse(body);
		                }
						catch (error) {
		                    console.error('Cannot parse JSON from API.', body);
							body = {};
		                }
					}

	                var reply = {
	                    statusCode     : response.statusCode,
	                    statusMessage  : response.statusMessage,
	                    headers        : response.headers,
	                    body           : body
	                };

	                if (response.statusCode < 200 || response.statusCode > 299) {
	                    reject(new Error(reply.statusMessage));
	                }
					else {
	                    resolve(reply);
	                }
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


module.exports = Gopher;
