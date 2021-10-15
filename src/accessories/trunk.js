var {Service, Characteristic} = require('../homebridge.js');
var Switch = require('./core/switch.js');

module.exports = class extends Switch {

    constructor(options) {
        var config = {
            "name": "Trunk"
        };

        super({...options, config:Object.assign({}, config, options.config)});
    }

    
    async turnOn() {
		try {
			await this.updateSwitchState(true);
			await this.vehicle.post('command/actuate_trunk', {which_trunk:'rear'});

		}
		catch(error) {
			this.log(error);
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

