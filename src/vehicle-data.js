var isString = require('yow/isString');

module.exports = class VehicleData {

    constructor(response) {
        this.response = response;
        this.json = response;
    }

    getCarVersion() {
        return this.json.vehicle_state && isString(this.json.vehicle_state.car_version) ? this.json.vehicle_state.car_version : 'Unknown';
    }

    getVIN() {
        return this.json.vin;
    }

    getDisplayName() {
        return this.json.display_name;
    }

    getOptionCodes() {
        return isString(this.json.option_codes) ? this.json.option_codes.split(',') : [];
    }

    getModel() {

        var optionCodes = this.getOptionCodes();
        var model = 'Unknown model';

        optionCodes.forEach((code) => {
            switch(code) {
                case 'MDLS':
                case 'MS03':
                case 'MS04': {
                    model = 'Model S';
                    break;
                }
                case 'MDLX': {
                    model = 'Model X';
                    break;
                }
                case 'MDL3': {
                    model = 'Model 3';
                    break;
                }
                case 'MDLY': {
                    model = 'Model Y';
                    break;
                }
            }            
        });

        return model;

    }

    isVehicleLocked() {
        return this.response && this.response.vehicle_state && this.response.vehicle_state.locked;
    }

    isAirConditionerOn() {
        return this.response && this.response.climate_state && this.response.climate_state.is_climate_on;
    }

    isClimateOn() {
        return this.response && this.response.climate_state && this.response.climate_state.is_climate_on;
    }

    getInsideTemperature(defaultValue = 20) {
        if (this.response && this.response.climate_state && this.response.climate_state.inside_temp)
            return this.response.climate_state.inside_temp;
            
        return defaultValue;
    }

    getOutsideTemperature(defaultValue = 20) {
        if (this.response && this.response.climate_state && this.response.climate_state.outside_temp)
            return this.response.climate_state.outside_temp;
            
        return defaultValue;
    }

    getBatteryLevel(defaultValue = 0) {
        if (this.response.charge_state && this.response.charge_state.battery_level != undefined)
            return this.response.charge_state.battery_level;

        return defaultValue;        
    }

    getChargingState() {
        // returns "Disconnected", "Stopped", "Complete" or "Charging"
        return (this.response && this.response.charge_state) ? this.response.charge_state.charging_state : '';
    }

    isCharging() {
        return this.getChargingState() == 'Charging';
    }

    isChargingStarting() {
        return this.getChargingState() == 'Starting';
    }

    isChargingStopped() {
        return this.getChargingState() == 'Stopped';
    }

    isChargingComplete() {
        return this.getChargingState() == 'Complete';
    }

    isChargingDisconnected() {
        return this.getChargingState() == 'Disconnected';
    }


}

