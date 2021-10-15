
var Timer = require('yow/timer');
var Switch = require('./core/switch.js');

module.exports = class extends Switch {

    constructor(options) {

        var config = {
            name: 'Ping',
            requiredBatteryLevel : 40,
            timerInterval : 5
        };

        super({...options, config:Object.assign({}, config, options.config)});
        
        var timer = new Timer();
        var timerInterval = this.config.timerInterval * 60000;
        var requiredBatteryLevel = this.config.requiredBatteryLevel;

        // Listen to responses from Tesla API
        this.vehicle.on('response', () => {

            // Whenever we get a response, reset the timer
            if (this.getSwitchState()) {
                this.debug('Resetting ping timer.');
                timer.setTimer(timerInterval, this.ping.bind(this));
            }
            else
                timer.cancel();

        });

		this.vehicle.on('vehicle_data', async (vehicleData) => {

			try {
				var batteryLevel = vehicleData.charge_state.battery_level;

				if (this.getSwitchState() && batteryLevel < requiredBatteryLevel) {
					this.log(`Battery level too low for ping to be enabled. Setting ping state to OFF.`);
					
					await this.setSwitchState(false); 
					await this.updateSwitchState();
				}
	
			}
			catch(error) {
				this.log(error);
			}
        });

    }

    turnOn() {
        return this.ping();
    }

    ping() {
        this.debug('Ping!');
        return this.vehicle.getVehicleData();     

    }


}


