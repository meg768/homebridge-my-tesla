

module.exports = class VehicleData {

    constructor(response) {
        this.response = response;
    }

    isVehicleLocked() {
        return this.response && this.response.vehicle_state && this.response.vehicle_state.locked;
    }

    isAirConditionerOn() {
        return this.response && this.response.climate_state && this.response.climate_state.is_climate_on;
    }

    getInsideTemperature(defaultValue = 20) {
        if (this.response && this.response.climate_state && this.response.climate_state.inside_temp)
            return this.response.climate_state.inside_temp;
            
        return defaultValue;
    }

    getBatteryLevel(defaultValue = 0) {
        if (this.response.charge_state && this.response.charge_state.battery_level != undefined)
            return this.response.charge_state.battery_level;

        return defaultValue;        
    }

    isCharging(defaultValue = false) {
        var charging = defaultValue;

        if (this.response && this.response.charge_state) {
            switch (this.response.charge_state.charging_state) {
                case 'Disconnected': {
                    charging = false;
                    break;
                }
                case 'Stopped': {
                    charging = false;
                    break;
                }
                default: {
                    charging = true;
                    break;
                }
            }
        }

        return charging;
    };



}

