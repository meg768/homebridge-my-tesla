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
        this.timer = new Timer();
		this.addService(new Service.Switch(this.name));
        this.enableCharacteristic(Service.Switch, Characteristic.On, this.getState.bind(this), this.setState.bind(this));
/*
        this.vehicle.on('wake_up', async (response) => {

			if (response.state == 'online') {
				await this.vehicle.post('vehicle_data'); 

				// Reset timer
				this.timer.setTimer(this.config.timerInterval * 60000, this.ping.bind(this));
			}

        });

		this.vehicle.on('vehicle_data', async (vehicleData) => {

			try {
				var batteryLevel = vehicleData.charge_state.battery_level;

				if (this.getState() && batteryLevel < this.config.requiredBatteryLevel) {
					this.log(`Battery level too low for ping to be enabled. Setting ping state to OFF.`);
					
					await this.setState(false); 
					
					this.updateCharacteristicValue(Service.Switch, Characteristic.On, this.state);
				}
	
			}
			catch(error) {
				this.log(error);
			}
        });
*/
    }

	getState() {
		return this.state;
	}

	async setState(state) {

		try {
			state = state ? true : false;

			if (state != this.state) {
				
				if (state) {
					await this.ping();
				}
				else {
					this.timer.cancel();
					this.debug(`Ping turned OFF.`);
				}

				this.state = state;
				this.updateCharacteristicValue(Service.Switch, Characteristic.On, this.state);

			}	
		}
		catch(error) {
			this.log(error);
		}
	}

	async ping() {

		this.debug('Ping!');

		await this.vehicle.post('wake_up');

		// Reset timer
		this.timer.setTimer(this.config.timerInterval * 60000, this.ping.bind(this));

	}



}


