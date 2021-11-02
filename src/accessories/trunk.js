var {Service, Characteristic} = require('../homebridge.js');
var Accessory = require('../accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        var config = {
            "name": "Trunk"
        };

		super({...options, config:{...config, ...options.config}});

		this.state = false;
        this.addService(new Service.Switch(this.name));
        this.enableCharacteristic(Service.Switch, Characteristic.On, this.getState.bind(this), this.setState.bind(this));
    }

	async updateState(state) {
		state = state ? true : false;

		if (state != this.state) {
			this.getService(Service.Switch).getCharacteristic(Characteristic.On).updateValue(this.state = state);
		}
	}

	getState() {
		return this.state;
	}

	async setState(state) {
		try {
			state = state ? true : false;

			if (state) {
				this.debug(`Setting trunk state to "${state}".`);
	
				await this.updateState(true);
				await this.vehicle.post('command/actuate_trunk', {which_trunk:'rear'});

			}
		}
		catch(error) {
			this.log(error);
		}
		finally {
			await this.updateState(false);
		}
    }	




}

