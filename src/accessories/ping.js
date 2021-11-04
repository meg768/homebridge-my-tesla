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

		this.vehicle.on('vehicle_data', (vehicleData) => {

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

			var ping = (state) => {
				if (state) {
					this.debug('Ping!');
					this.vehicle.updateVehicleData();		
					this.timer.setTimer(this.config.timerInterval * 60000, ping.bind(this, true));	
				}
				else {
					this.debug('Ping turned OFF.');
					this.timer.cancel();
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
			this.pause(1000, () => {
				this.updateCharacteristicValue(Service.Switch, Characteristic.On, this.state);
			});
		}
	}



}


