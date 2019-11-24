var isString = require('yow/isString');


class DriveState {

    constructor(json) {
        this.json = json || {};
    }

    getShiftState() {
        return isString(this.json.shift_state) ? this.json.shift_state : '';
    }

    isDriving() {
        return this.getShiftState() != '';
    }

}

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

class VehicleData {

    constructor(json) {
        this.json         = json;
        this.vehicleState = new VehicleState(json.vehicle_state);
        this.climateState = new ClimateState(json.climate_state);
        this.chargeState  = new ChargeState(json.charge_state);
        this.driveState   = new DriveState(json.drive_state);
    }

    getDisplayName() {
        return this.json.display_name;
    }

    getVIN() {
        return this.json.vin;
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

}


module.exports.VehicleData = VehicleData;
module.exports.ClimateState = ClimateState;
module.exports.ChargeState = ChargeState;
module.exports.VehicleState = VehicleState;
module.exports.DriveState = DriveState;

