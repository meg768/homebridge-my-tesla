
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');
var Accessory = require('./accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        var service = new Service.ContactSensor(this.name, 'freeze');

        this.state = false;
        this.addService(service);

        var setState = (state) => {
            if (state != this.state) {
                service.getCharacteristic(Characteristic.ContactSensorState).updateValue(this.state = state);
            }    
        };

        var getState = (response) => {
            if (!(response instanceof VehicleData))
                response = new VehicleData(response);

            return response.getInsideTemperature() < 8;
        };

        this.on('refresh', (response) => {
            setState(getState(response));
        });


        service.getCharacteristic(Characteristic.ContactSensorState).on('get', (callback) => {

            if (this.api.isOnline()) {
                Promise.resolve().then(() => {
                    return this.api.getVehicleData();
                })
                .then((response) => {
                    this.state = getState(response);
                    callback(null, this.state);
                })
                .catch((error) => {
                    this.log(`Could not get freeze temperature...`);
                    callback(null);
                });
            }
            else
                callback(null);
        });

        
    }; 



}

