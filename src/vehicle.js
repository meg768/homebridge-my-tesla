//var TeslaAPI = require('./tesla-api-request.js');
var TeslaAPI = require('./tesla-api-request.js');
var Events = require('events');
var {Service, Characteristic} = require('./homebridge.js');
var Timer = require('yow/timer');




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
		this.updateVehicleTimer = new Timer();
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

		addAccessory(require('./accessories/doors.js'), 'doors');
		addAccessory(require('./accessories/charging.js'), 'charging');
		addAccessory(require('./accessories/hvac.js'), 'hvac');
		addAccessory(require('./accessories/ping.js'), 'ping');
		addAccessory(require('./accessories/inside-temperature.js'), 'insideTemperature');
		addAccessory(require('./accessories/outside-temperature.js'), 'outsideTemperature');
		addAccessory(require('./accessories/trunk.js'), 'trunk');
		addAccessory(require('./accessories/defrost.js'), 'defrost');
		addAccessory(require('./accessories/steering-wheel-heater.js'), 'steeringWheelHeater');
		addAccessory(require('./accessories/ventilation.js'), 'ventilation');
		//addAccessory(require('./accessories/thermostat.js'), 'thermostat');
		//addAccessory(require('./accessories/battery.js'), 'battery');


		var vehicle = await this.api.getVehicle();
		var model = 'Unknown';
		
		vehicle.option_codes.split(',').forEach((code) => {
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
			service.setCharacteristic(Characteristic.SerialNumber, `${vehicle.vin}`);
			service.setCharacteristic(Characteristic.FirmwareRevision, `${vehicle.api_version}`);
			
		})

		await this.getVehicleData();

		return accessories;
		
    }

	updateVehicleData(delay = 1000) {
		this.updateVehicleTimer.setTimer(delay, () => {
			try {
				this.getVehicleData();
			}
			catch(error) {
				this.log(error);

			}
		});
	}

	async getVehicleData() {
		return await this.get('vehicle_data');
    }

	async request(method, path, options) {
		this.debug(`Tesla request ${method} ${path} ${options ? JSON.stringify(options) : ''}`);
		var response = await this.api.request(method, path, options);

		if (response)
			this.emit(path, response);

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
