var {Service, Characteristic} = require('../homebridge.js');
var Switch = require('./core/switch.js');
var Lock = require('./core/lock.js');

module.exports = class extends Switch {

    constructor(options) {
        var config = {
            "name": "Trunk"
        };

        super({...options, config:Object.assign({}, config, options.config)});
    }

    async turnOn() {
		try {
			await this.vehicle.post('command/actuate_trunk', {which_trunk:'rear'});
			await this.updateSwitchState(true);

		}
		catch(error) {
			this.debug(error);
		}
		finally {
			setTimeout(() => {
				this.updateSwitchState(false);
			}, 1000);	
		}
	}

    async turnOff() {
	}



}

