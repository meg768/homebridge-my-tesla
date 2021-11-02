var {Service, Characteristic} = require('../homebridge.js');
var Accessory = require('../accessory.js');
var isString = require('yow/isString');


module.exports = class extends Accessory {


    constructor(options) {
        var config = {
            "name": "Doors"
        };

		super({...options, config:Object.assign({}, config, options.config)});

		this.doorPosition = 0;

		this.addService(new Service.Door(this.name));

        this.enableCharacteristic(Service.Door, Characteristic.CurrentPosition, this.getCurrentPosition.bind(this));
        this.enableCharacteristic(Service.Door, Characteristic.PositionState, this.getPositionState.bind(this));
        this.enableCharacteristic(Service.Door, Characteristic.TargetPosition, this.getTargetPosition.bind(this), this.setTargetPosition.bind(this));

		this.vehicle.on('vehicle_data', (data) => {       
            this.doorPosition = data.vehicle_state.locked ? 0 : 100;
			
            this.debug(`Updated door position to ${this.doorPosition}%.`);

			this.getService(Service.Door).getCharacteristic(Characteristic.CurrentPosition).updateValue(this.doorPosition);
			this.getService(Service.Door).getCharacteristic(Characteristic.PositionState).updateValue(this.doorPosition);

        });


    }

	getCurrentPosition() {
		return this.doorPosition;
	}

	getPositionState() {
		return 2;
		
	}

	getTargetPosition() {
		return this.doorPosition;
	}

    async setTargetPosition(value) {
		if (value < 50) {
			await this.vehicle.post('command/door_lock');
			this.doorPosition = 0;

		}
		else {
			await this.vehicle.post('command/door_unlock');

			if (isString(this.config.remoteStartDrivePassword))
				await this.vehicle.post(`command/remote_start_drive?password=${this.config.remoteStartDrivePassword}`);
	
			this.doorPosition = 100;
		}

		this.vehicle.getVehicleData(1000);

    }


};
