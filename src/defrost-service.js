
var Service  = require('./homebridge.js').Service;
var Characteristic  = require('./homebridge.js').Characteristic;
var VehicleData = require('./vehicle-data.js');

module.exports = class extends Service.Switch {

    constructor(tesla, name) {
        super(name, "defrost");

        var defrostActive = false;
        var log = tesla.log;
        var interval = 5 * 60000;
        var minTemperature = 4;

        this.getCharacteristic(Characteristic.On).on('get', (callback) => {
            callback(null, defrostActive);    
        });
    
        this.getCharacteristic(Characteristic.On).on('set', (value, callback) => {
            callback(null, defrostActive = value);    
        });


        var loop = () => {

            if (!defrostActive) {
                log(`Defrost not active...`);
                return setTimeout(loop.bind(this), interval);
            }

            log(`Checking temperature for vehicle...`);

            tesla.api.wakeUp().then(() => {
                return tesla.api.getVehicleData();         
            })
            .then((response) => {
                response = new VehicleData(response);
                var temperature = response.getInsideTemperature();

                if (!response.isCharging()) {
                    return Promise.resolve();
                }
                else if (response.getInsideTemperature() < minTemperature) {
                    log(`Starting air conditioner since temperature is ${temperature}.`);
                    return tesla.api.autoConditioningStart(vin);
                }
                else {
                    log(`Stopping air conditioner since temperature is ${temperature}.`);
                    return tesla.api.autoConditioningStop(vin);        
                }
            })
            .then(() => {
                tesla.update();
            })
            .catch((error) => {
                log(error);
            })
            .then(() => {
                setTimeout(loop.bind(this), interval);
            })
        }

        loop();

    }
}; 

