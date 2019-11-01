
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');
var Accessory = require('./accessory.js');

module.exports = class extends Accessory {

    constructor(options) {
        super(options);

        this.currentTemperature = 50;

        var service = new Service.TemperatureSensor(this.name, 'inside-temperature');
        this.enableCurrentTemperature(service);
        this.addService(service);

        
    }; 

    enableCurrentTemperature(service) {
        var ctx = service.getCharacteristic(Characteristic.CurrentTemperature);

        this.on('vehicleData', (response) => {      

            if (response && response.climate_state && response.climate_state.inside_temp)
                this.currentTemperature = response.climate_state.inside_temp;

            ctx.updateValue(this.currentTemperature);
        });

        ctx.on('get', (callback) => {
            callback(null, this.currentTemperature);
        });

    }

}

