
var Service = require('./homebridge.js').Service;
var Characteristic = require('./homebridge.js').Characteristic;
var Accessory = require('./accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        this.state = undefined;

        var service = new Service.Fan(this.name, "hvac");

        this.enableCharacteristicOn(service);
        this.addService(service);
    }

    getState() {
        return this.state;
    }

    setState(state) {
        state = state ? true : false;

        return new Promise((resolve, reject) => {

            Promise.resolve().then(() => {
                if (state == this.state)
                    return Promise.resolve();
                else {
                    this.log(`Turning HVAC state to ${state ? 'ON' : 'OFF'}.`);
 
                    if (state)
                        return this.api.autoConditioningStart();
                    else
                        return this.api.autoConditioningStop();

                }
            })
            .then(() => {
                resolve(this.state = state);
            })
            .catch((error) => {
                reject(error);
            })
        });

    }

    enableCharacteristicOn(service) {

        var ctx = service.getCharacteristic(Characteristic.On);

        this.on('vehicleData', (vehicleData) => {
            this.state = vehicleData && vehicleData.climate_state && vehicleData.climate_state.is_climate_on; 
            ctx.updateValue(this.state);
        });

        ctx.on('get', (callback) => {
            callback(null, this.getState());
        });

        ctx.on('set', (value, callback) => {
            this.setState(value).then(() => {
                callback(null, this.getState());
            })
            .catch((error) => {
                this.log(error);
                callback(null);
            })

        });

        
    }


}

