function isString(arg) {
	return typeof arg == 'string';
};

function isObject(arg) {
	return typeof arg == 'object' && arg != null;
};

function isFunction(arg) {
	return typeof arg === 'function';
};

function isString(arg) {
	return typeof arg === 'string';
};

var Request = require('./json-api-request.js');



module.exports = class TeslaAPI {

	constructor(options) {

		this.token = options.refreshToken || options.token;
		this.api = undefined;
		this.apiInvalidAfter = undefined;
		this.vin = options.vin;
		this.vehicle = undefined;
        this.wakeupTimeout = 60000;
		this.debug = () => {};

		if (!isString(this.vin))
			throw new Error('A vehicle ID (VIN) must be specified.');
		
		if (!isString(this.token))
			throw new Error('A refresh token must be specified.');

		if (options.debug) {
	        this.debug = typeof options.debug === 'function' ? options.debug : console.log;
        }

	}



	async getAPI() {

		var now = new Date();

		if (this.api && this.apiInvalidAfter && now.getTime() < this.apiInvalidAfter.getTime())
			return this.api;

		this.debug(`No access token or too long since access token was generated.`);

		var getAccessToken = async () => {
			var options = {
				headers: {
					"content-type": "application/json; charset=utf-8"
				},
				body: {
					"grant_type": "refresh_token",
					"refresh_token": this.token,
					"client_id": "ownerapi"	
				}
			};
	
			this.debug(`Fetching new access token...`);
	
			var request = new Request("https://auth.tesla.com");
			var reply = await request.post("oauth2/v3/token", options);
	
			return reply.body.access_token;
		}

		var accessToken = await getAccessToken();

		var options = {
            headers: {
                "content-type": `application/json; charset=utf-8`,
				"authorization": `Bearer ${accessToken}`
            }
        };

		// Create new API with the specifies access token
		this.api = new Request("https://owner-api.teslamotors.com/api/1", options);

		// Make sure we create a new API within a week or so
		this.apiInvalidAfter = new Date();
		this.apiInvalidAfter.setDate(this.apiInvalidAfter.getDate() + 7);

		this.debug(`This access token will expire ${this.apiInvalidAfter}.`);

		return this.api;				
	}

	async connect() {

		var api = await this.getAPI();
		var request = await api.get('vehicles');
		var vehicles = request.body.response;

		var vehicle = vehicles.find((item) => {
			return item.vin == this.vin;
		});

		if (vehicle == undefined) {
			throw new Error(`Vehicle ${this.vin} could not be found.`);
		}		

		this.vehicle = vehicle;
	}


	async request(method, path, options) {

		// Connect if not already done
		if (this.vehicle == undefined) {
			await this.connect();
		}

		var api = await this.getAPI();
		var then = new Date();

		var pause = (ms) => {
			return new Promise((resolve, reject) => {
				setTimeout(resolve, ms);
			});            
		};

		var wakeUp = async () => {
			var now = new Date();

			this.debug(`Sending wakeup to vehicle ${this.vin}...`);

			var reply = await api.post(`vehicles/${this.vehicle.id}/wake_up`);
			var response = reply.body.response;
	
			if (now.getTime() - then.getTime() > this.wakeupTimeout)
				throw new Error('Your Tesla cannot be reached within timeout period.');

			if (response.state == "online") {
				return response;
			}
			else {
				await pause(500);
				return await wakeUp();
			}
		}


		var path = `vehicles/${this.vehicle.id}/${path}`;
		var response = await api.request(method, path, options);
	
		switch(response.statusCode) {
			case 200: {
				break;
			}

			case 408:
			case 504: {
				await wakeUp();
				response = await api.request(method, path);
				break;
			}

			default: {
				throw new Error(`${response.statusMessage}. Status code ${response.statusCode}`);
			}
		}

		response = response.body.response;

		if (isObject(response) && isString(response.reason) && response.result === false) {
			throw new Error(`Tesla request failed - ${response.reason}.`);

		}

		return response;
	}

	async get(path) {
		return await this.request('GET', path);
	}

	async post(path, body) {
		return await this.request('POST', path, {body:body});
	}

}
