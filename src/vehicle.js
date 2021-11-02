var TeslaAPI = require('./tesla-api-request.js');
var Events = require('events');
var isObject = require('yow/isObject');
var isString = require('yow/isString');
var {Service, Characteristic} = require('./homebridge.js');




module.exports = class Vehicle extends Events  {

    constructor(platform, config) {

		super();

		this.log = platform.log;
		this.debug = platform.debug;
        this.config = config;
        this.name = config.name;
        this.accessories = [];
        this.uuid = platform.generateUUID(config.vin);
        this.platform = platform;
		this.api = new TeslaAPI({token:config.token, vin:config.vin, debug:this.debug});
    }


	async pushover(message) {
		try {
			var Request = require('./json-api-request.js'); 
			var api = new Request('https://api.pushover.net/1');
			var payload = {...this.config.pushover, message:undefined}

			if (payload == undefined || payload.user == undefined || payload.token == undefined)
				return;

			if (isString(message) && message.length > 0) {
				payload.message = message;
			}

			this.debug('Sending Pushover payload:', JSON.stringify(payload));
			await api.post('messages.json', {body:payload});


		} 
		catch (error) {
			this.log(error);
		}
	}

	async notifyError(error) {
		try {
			this.debug(error);
			await this.pushover(error.message);
		}
		catch(error) {
			this.log(error);
		}
		finally {

		}
	}

    async getAccessories() {

        var accessories = [];

        var addAccessory = (fn, name) => {
			this.debug(`Searching for accessory ${name}...`);

			if  (this.config.expose == undefined || this.config.expose.indexOf(name) >= 0) {
				this.debug(`Exposing accessory ${name}...`);
				var config = this.config.accessories ? this.config.accessories[name] : {};

				if (config == undefined || config.enabled == undefined || config.enabled) {
					accessories.push(new fn({vehicle:this, config:config || {}}));
				}
	
			}

        };


		addAccessory(require('./accessories/door-lock.js'), 'doors');
		addAccessory(require('./accessories/charging.js'), 'charging');
		addAccessory(require('./accessories/hvac.js'), 'hvac');
		addAccessory(require('./accessories/ping.js'), 'ping');
		addAccessory(require('./accessories/inside-temperature.js'), 'insideTemperature');
		//addAccessory(require('./accessories/thermostat.js'), 'thermostat');
		addAccessory(require('./accessories/outside-temperature.js'), 'outsideTemperature');
		addAccessory(require('./accessories/trunk.js'), 'trunk');
		addAccessory(require('./accessories/defrost.js'), 'defrost');
		addAccessory(require('./accessories/steering-wheel-heater.js'), 'steeringWheelHeater');
		//addAccessory(require('./accessories/battery.js'), 'battery');


		var vehicleData = await this.getVehicleData();
		var model = 'Unknown';
		
		vehicleData.option_codes.split(',').forEach((code) => {
            switch(code) {
                case 'MDLS':
                case 'MS03':
                case 'MS04': {
                    model = 'Model S';
                    break;
                }
                case 'MDLX': {
                    model = 'Model X';
                    break;
                }
                case 'MDL3': {
                    model = 'Model 3';
                    break;
                }
                case 'MDLY': {
                    model = 'Model Y';
                    break;
                }
            }            
        });

		// Update all accessories with info from Tesla
		accessories.forEach((accessory) => {
			var service = accessory.getService(Service.AccessoryInformation);
			service.setCharacteristic(Characteristic.Name, accessory.name);
			service.setCharacteristic(Characteristic.Manufacturer, "Tesla");
			service.setCharacteristic(Characteristic.Model, model);
			service.setCharacteristic(Characteristic.SerialNumber, `${vehicleData.vin}`);
			service.setCharacteristic(Characteristic.FirmwareRevision, `${vehicleData.vehicle_state.car_version}`);
			
		})

		return accessories;
		
    }

	getVehicle() {
        return this.api.vehicle;
    }

    getVehicleID() {
        return this.api.vehicle.id_s;
    }

	async getVehicleData(delay) {
		if (typeof delay == 'number') {
			await this.pause(delay);
		}

		var vehicle_data = await this.get('vehicle_data');

		if (vehicle_data)
			this.emit('vehicle_data', vehicle_data);

		return vehicle_data;	
    }

	async request(method, path, options) {
		var response = await this.api.request(method, path, options);
		this.emit('response', response);
		return response;
	}

	async post(path, body) {
		return this.request('POST', path, {body:body});
	}

	async get(path) {
		return this.request('GET', path);
	}



    async pause(ms, fn) {

		await this.delay(ms);

		if (fn)
			fn();

    }


    delay(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, ms);
        });
    }


}
