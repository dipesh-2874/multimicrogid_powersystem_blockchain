// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface IMicrogridRegistry {
    function getOwner(
        uint256 _id
        ) external view returns (address);
    
    function isMicrogridActive(
        uint256 _id
        ) external view returns (bool);
    
    function getAvailableEnergy(
        uint256 _id
        ) external view returns(uint256);

    function increaseReservedEnergy(
        uint256 _id, 
        uint256 _amount
        ) external;

    function decreaseReservedEnergy(
        uint256 _id,
        uint256 _amount
        ) external;

    function getPricingData(
        uint256 id
    ) external view returns (
        uint256 generation,
        uint256 demand,
        uint256 batteryLevel,
        uint256 maxCapacity,
        uint256 reservedEnergy
    );
}