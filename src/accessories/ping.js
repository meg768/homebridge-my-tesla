var Service = require('../homebridge.js').Service;
var Characteristic  = require('../homebridge.js').Characteristic;
var Accessory = require('../accessory.js');
var Timer = require('yow/timer');

module.exports = class extends Accessory {

    constructor(options) {

        var config = {
            name: 'Ping',
            requiredBatteryLevel : 40,
            timerInterval : 1
        };

		super({...options, config:{...config, ...options.config}});

		this.state = false;
        this.timer = new Timer();
		this.addService(new Service.Switch(this.name));
        this.enableCharacteristic(Service.Switch, Characteristic.On, this.getState.bind(this), this.setState.bind(this));

		this.vehicle.on('wake_up', async (response) => {
			try {
				this.debug(`Vehicle ${this.vehicle.config.vin} is ${response.state}.`);

				if (response.state == 'online') {
					this.debug(`Updating vehicle data.`);
					await this.pause(500);
					this.vehicle.get('vehicle_data');
				}
	
			}
			catch(error) {
				this.log(error);
			}
		});

		this.vehicle.on('vehicle_data', async (vehicleData) => {

			try {
				var batteryLevel = vehicleData.charge_state.battery_level;

				if (this.getState() && batteryLevel < this.config.requiredBatteryLevel) {
					this.debug(`Battery level is now ${batteryLevel}%. Required battery level for ping is ${this.config.requiredBatteryLevel}%`);
					this.setState(false); 
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

	async setState(state) {

		try {
			state = state ? true : false;

			var ping = async (state) => {
				try {
					if (state) {
						this.debug('Ping!');
						this.vehicle.post('wake_up');		
						this.timer.setTimer(this.config.timerInterval * 60000, ping.bind(this, true));	
					}
					else {
						this.debug('Ping turned OFF.');
						this.timer.cancel();
					}
	
				}
				catch(error) {
					this.log(error);
				}
			}

			if (state != this.state) {
				ping(state);
				this.state = state;

			}	
		}
		catch(error) {
			this.log(error);
		}
		finally {
			await this.pause(500);
			this.debug(`Updating ping state to ${this.state}`);
			this.updateCharacteristicValue(Service.Switch, Characteristic.On, this.state);
		}
	}



}


