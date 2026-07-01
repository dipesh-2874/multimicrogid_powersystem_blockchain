// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

// Price = Base Price + Availability Adjustment + Battery Level Adjustment
// Availability = (generation - demand - reservedEnergy)
// Availability Ratio = (availableEnergy / maxCapacity) * 100
// Availability Adjustment = price adjustment based on availability ratio
// Battery Level Adjustment = price adjustment based on battery level

library PricingLibrary{
    uint256 constant BASE_PRICE = 10; // 10 ETK/kWh

    uint256 constant HIGH_SURPLUS_DISC = 2;
    uint256 constant MID_SURPLUS_DISC = 1;

    uint256 constant LOW_SURPLUS_PREMIUM = 2;
    uint256 constant DEFICIT_SURPLUS_PREMIUM = 4;

    uint256 constant HIGH_BATTERY_DISC = 2;
    uint256 constant MID_BATTERY_DISC = 1;

    uint256 constant LOW_BATTERY_PREMIUM = 2;
    uint256 constant DEFICIT_BATTERY_PREMIUM = 4;

    function calculatePrice(
        uint256 generation, 
        uint256 demand, 
        uint256 batteryLevel, 
        uint256 maxCapacity, 
        uint256 reservedEnergy
    ) external pure returns (uint256){
        uint256 price = BASE_PRICE;

        int256 availableEnergy = int256(generation) - int256(demand) - int256(reservedEnergy);
        int256 availabilityRatio = (availableEnergy * 100) / int256(maxCapacity);

        // availability adjustments
        if(availabilityRatio >= 70) price -= HIGH_SURPLUS_DISC;
        else if(availabilityRatio >= 40) price -= MID_SURPLUS_DISC;
        else if(availabilityRatio >= 20) price += 0;
        else if(availabilityRatio >= 0) price += LOW_SURPLUS_PREMIUM;
        else price += DEFICIT_SURPLUS_PREMIUM;

        // battery level adjustments
        if(batteryLevel >= 80) price -= HIGH_BATTERY_DISC;
        else if(batteryLevel >= 60) price -= MID_BATTERY_DISC;
        else if(batteryLevel >= 40) price += 0;
        else if(batteryLevel >= 20) price += LOW_BATTERY_PREMIUM;
        else price += DEFICIT_BATTERY_PREMIUM;

        if(price < 1) price = 1;

        return price;
    }

    function calculateCost(uint256 _price, uint256 _amt) external pure returns (uint256) {
        require(_amt > 0, "Amount must be greater than 0");
        return (_amt * _price);
    }
}