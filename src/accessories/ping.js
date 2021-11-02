var Service = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Timer = require('yow/timer');

module.exports = class extends Accessory {

    constructor(options) {

        var config = {
            name: 'Ping',
            requiredBatteryLevel : 40,
            timerInterval : 5
        };

		super({...options, config:{...config, ...options.config}});

		this.state = false;
		this.addService(new Service.Switch(this.name));
        this.enableCharacteristic(Service.Switch, Characteristic.On, this.getState.bind(this), this.setState.bind(this));

        var timer = new Timer();
        var timerInterval = this.config.timerInterval * 60000;
        var requiredBatteryLevel = this.config.requiredBatteryLevel;

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {

            // Whenever we get a response, reset the timer
            if (this.getState()) {
                this.debug('Resetting ping timer.');
                timer.setTimer(timerInterval, this.ping.bind(this));
            }
            else
                timer.cancel();

        });

		this.vehicle.on('vehicle_data', async (vehicleData) => {

			try {
				var batteryLevel = vehicleData.charge_state.battery_level;

				if (this.getState() && batteryLevel < requiredBatteryLevel) {
					this.log(`Battery level too low for ping to be enabled. Setting ping state to OFF.`);
					
					await this.setState(false); 
					await this.updateState();
				}
	
			}
			catch(error) {
				this.log(error);
			}
        });

    }

	getState() {
		return this.state;
	}

	async updateState() {
		this.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(this.state);
	}

	async setState(state) {

		try {
			state = state ? true : false;

			if (state != this.state) {
				
				if (state)
					await this.ping();
				else	
					this.debug(`Ping turned OFF.`);

				this.state = state;
			}	
		}
		catch(error) {
			this.log(error);
		}
	}

	async ping() {
		this.debug('Ping!');
		await this.vehicle.getVehicleData();     
	}



}


