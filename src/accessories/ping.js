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
					this.debug(`Updating vehicle data since vehicle is online`);
					this.vehicle.updateVehicleData();
				}
	
			}
			catch(error) {
				this.log(error);
			}
		});

		this.vehicle.on('vehicle_data', async (vehicleData) => {

			try {

				if (this.getState()) {
                    var batteryLevel = vehicleData.charge_state.battery_level;

                    if (batteryLevel < this.config.requiredBatteryLevel) {
                        this.debug(`Battery level is now ${batteryLevel}%.`);
						this.debug(`Required battery level for ping is ${this.config.requiredBatteryLevel}%`);
						await this.setState(false); 
					}
	
				}

	
			}
			catch(error) {
				this.log(error);
			}
        });

    }

    async ping() {
        if (this.getState()) {
            let vehice = await this.getVehicle();

            if (vehice.state == 'online') {
                this.vehicle.get('vehicle_data');
                this.timer.setTimer(1000, this.ping.bind(this));	
    
            }
            else {
                this.vehicle.post('wake_up');
                this.timer.setTimer(5000, this.ping.bind(this));	    
            }

        
        }
        else {
            this.timer.cancel();
        }
    }

	getState() {
		return this.state;
	}

	async setState(state) {

		try {
			state = state ? true : false;

			if (state != this.state) {
                this.debug(`Ping turned ${state ? 'ON' : 'OFF'}.`);
				this.state = state;
				this.updateCharacteristicValue(Service.Switch, Characteristic.On, this.state);

                await this.ping();
	
			}	
		}
		catch(error) {
			this.log(error);
		}
	}



}


