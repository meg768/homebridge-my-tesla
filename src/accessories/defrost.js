var {Service, Characteristic} = require('../homebridge.js');
var Switch = require('./core/switch.js');

module.exports = class extends Switch {

    constructor(options) {
        var config = {
            "name": "Defrost"
        };

        super({...options, config:Object.assign({}, config, options.config)});

        this.vehicle.on('vehicle_data', (vehicleData) => {    
			this.updateSwitchState(vehicleData.climate_state.defrost_mode != 0);
        });
	}

    async turnOn() {
		await this.vehicle.post('command/set_preconditioning_max', {on:true});
		this.vehicle.getVehicleData(5000);
	}

    async turnOff() {
		await this.vehicle.post('command/set_preconditioning_max', {on:false});
		this.vehicle.getVehicleData(5000);

	}



}

