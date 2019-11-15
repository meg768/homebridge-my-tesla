var isString = require('yow/isString');


class VehicleState {

    constructor(json) {
        this.json = json || {};
    }

    getCarVersion() {
        return isString(this.json.car_version) ? this.json.car_version : 'Unknown';
    }

    isLocked() {
        return this.json.locked === true;
    }

}


class ClimateState {

    constructor(json) {
        this.json = json || {};
    }

    isClimateOn() {
        return this.json.is_climate_on === true;
    }

    getInsideTemperature() {
        return this.json.inside_temp;        
    }

    getOutsideTemperature() {
        return this.json.outside_temp;        
    }

}

class ChargeState {

    constructor(json) {
        this.json = json || {};
    }

    getChargingState() {
        // returns "Disconnected", "Stopped", "Complete" or "Charging"
        return isString(this.json.charging_state) ? this.json.charging_state : '';
    }

    getBatteryLevel() {
        return this.json.battery_level;
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

class VehicleData {

    constructor(json) {
        this.json = json;
        this.vehicleState = new VehicleState(json.vehicle_state);
        this.climateState = new ClimateState(json.climate_state);
        this.chargeState = new ChargeState(json.charge_state);
    }

    getCarVersion() {
        return this.vehicleState.getCarVersion();
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
        return this.vehicleState.isLocked();
    }

    isClimateOn() {
        return this.climateState.isClimateOn();
    }


    getInsideTemperature() {
        return this.climateState.getInsideTemperature();
    }

    getOutsideTemperature() {
        return this.climateState.getOutsideTemperature();
    }

    getBatteryLevel() {
        return this.chargeState.getBatteryLevel();
    }

    getChargingState() {
        return this.chargeState.getChargingState();
    }

    isCharging() {
        return this.chargeState.getChargingState() == 'Charging';
    }

    isChargingStarting() {
        return this.chargeState.getChargingState() == 'Starting';
    }

    isChargingStopped() {
        return this.chargeState.getChargingState() == 'Stopped';
    }

    isChargingComplete() {
        return this.chargeState.getChargingState() == 'Complete';
    }

    isChargingDisconnected() {
        return this.chargeState.getChargingState() == 'Disconnected';
    }


}


module.exports.VehicleData = VehicleData;
module.exports.ClimateState = ClimateState;
module.exports.ChargeState = ChargeState;
module.exports.VehicleState = VehicleState;

