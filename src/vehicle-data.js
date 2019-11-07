

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
        return this.response && this.response.charge_state ? this.response.charge_state.charging_state : '';
    }

    isConnectedToCharger() {
        return this.isCharging() || this.isChargingComplete() || this.isChargingStopped();        
    }

    isCharging() {
        return this.getChargingState() == 'Charging';
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

