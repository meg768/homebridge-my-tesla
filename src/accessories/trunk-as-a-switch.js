var {Service, Characteristic} = require('../homebridge.js');
var Accessory = require('../accessory.js');


module.exports = class extends Accessory {

    constructor(options) {
		super({...options, config:{...{name:'Trunk'}, ...options.config}});

        this.state = undefined;
		this.addService(new Service.Switch(this.name));
        this.enableCharacteristic(Service.Switch, Characteristic.On, this.getState.bind(this), this.setState.bind(this));

		this.vehicle.on('vehicle_data', async (vehicleData) => {    
			
			try {
				this.state = (vehicleData.vehicle_state.rt == 0 ? false : true);

				await this.pause(500);
				
				this.debug(`Updating trunk lock status to ${this.state ? 'OPEN' : 'CLOSED'}.`);
				this.updateCharacteristicValue(Service.Switch, Characteristic.On, this.state);

			}
			catch(error) {
				this.log(error);

			}
        });
    }


    getState() {
        return this.state == undefined ? false : this.state;
    }

    async setState(value) {

		if (value == this.state)
			return;

		try {
			await this.vehicle.post('command/actuate_trunk', {which_trunk:'rear'});
		}
		catch(error) {
			this.log(error);
		}
		finally {
			// Refresh after a while, it takes some time to open/close
			this.vehicle.updateVehicleData(5000);
		}
    }


};

