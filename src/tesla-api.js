


module.exports = class TeslaAPI {

	constructor(options) {

		var Request = require('yow/request');
		
		this.token = options.token;
		this.vin = options.vin;
		this.vehicle = undefined;
        this.wakeupTimeout  = 30000;
		this.debug = console.log;

		if (this.token == undefined)
			throw new Error('A token must be specifed.');

		if (this.vin == undefined)
			throw new Error('A vehicle ID (VIN) must be specifed.');

		var requestOptions = {
            headers: {
                "content-type": `application/json; charset=utf-8`,
				"authorization": `Bearer ${this.token}`
            }
        };

		this.url = "https://owner-api.teslamotors.com/api/1";
		this.api = new Request(this.url, requestOptions);		
	}

	async connect() {

		var request = await this.api.request('GET', 'vehicles');
		var vehicles = request.body.response;

		var vehicle = vehicles.find((item) => {
			return item.vin == this.vin;
		});

		if (vehicle == undefined) {
			throw new Error(`Vehicle ${this.vin} could not be found.`);
		}		

		this.vehicle = vehicle;
	}


	async request(method, path) {

		// Connect if not already done
		if (this.vehicle == undefined) {
			await this.connect();
		}

		var then = new Date();

		var pause = (ms) => {
			return new Promise((resolve, reject) => {
				setTimeout(resolve, ms);
			});            
		};

		var wakeUp = async () => {
			var now = new Date();

			this.debug(`Sending wakeup to vehicle ${this.vin}...`);

			var reply = await this.api.request('POST', `vehicles/${this.vehicle.id}/wake_up`);
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
		var response = await this.api.request(method, path);
	
		if (response.statusCode == 408) {
			await wakeUp();
			response = await this.api.request(method, path);
		}

		if (response.statusCode != 200) {
			throw new Error(response.statusMessage);
		}

		return response.body.response;
	}

	async get(path) {
		return await this.request('GET', path);
	}

	async post(path) {
		return await this.request('POST', path);
	}

	async command(path) {
		return await this.post(`command/${path}`);
	}



}
