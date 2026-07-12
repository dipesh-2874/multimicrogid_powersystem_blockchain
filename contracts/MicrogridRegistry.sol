// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MicrogridRegistry is Ownable {

    constructor(address _owner) Ownable(_owner) {}

    struct Microgrid {
        uint256 id;
        string name;
        address owner;
        uint256 latitude; // in microdegrees
        uint256 longitude; // in microdegrees

        uint256 energyGenerated; // in kWh
        uint256 energyDemand; // in kWh
        uint256 batteryLevel;
        uint256 maxCapacity; // in kWh
        uint256 reservedEnergy; // in kWh

        bool isActive;
        uint256 lastUpdated; // timestamp
    }

    uint256 public nextId;
    mapping(uint256 => Microgrid) public microgrids;
    mapping(address => bool) public isRegistered;
    mapping(address => uint256) public ownerToMicrogridId;

    address public marketplaceAddress;

    // events
    event MicrogridRegistered(uint256 indexed id, address indexed owner, string name, uint256 latitude, uint256 longitude);
    event StatusUpdated(uint256 indexed id, uint256 energyGenerated, uint256 energyDemand, uint256 batteryLevel, uint256 lastUpdated);
    event ReservedEnergyUpdated(uint256 indexed id, uint256 reservedEnergy);

    //modifiers
    modifier onlyMicrogridOwner(uint256 id) {
        require(microgrids[id].owner == msg.sender, "Not the owner of this microgrid");
        _;
    }

    modifier onlyMarketplace() {
        require(msg.sender == marketplaceAddress, "Only the marketplace can call this function");
        _;
    }

    // functions
    function setMarketplaceAddress(address _marketplaceAddress) public onlyOwner {
        require(marketplaceAddress == address(0), "Marketplace address already set");
        marketplaceAddress = _marketplaceAddress;
    }

    function getOwner(uint256 _id) external view returns (address) {
        require(_id < nextId, "Microgrid does not exist");
        return microgrids[_id].owner;
    }

    function isMicrogridActive(uint256 _id) external view returns (bool) {
        require(_id < nextId, "Microgrid does not exist");
        return microgrids[_id].isActive;
    }

    function registerMicrogrid(string memory _name, uint256 _latitude, uint256 _longitude, uint256 _maxCapacity) public {
        require(_maxCapacity > 0, "Max capacity must be greater than zero");
        require(!isRegistered[msg.sender], "Microgrid already registered for this owner");
        uint256 id = nextId++;
        microgrids[id] = Microgrid({
            id: id,
            name: _name,
            owner: msg.sender,
            latitude: _latitude,
            longitude: _longitude,
            energyGenerated: 0,
            energyDemand: 0,
            batteryLevel: 100,
            maxCapacity: _maxCapacity,
            reservedEnergy: 0,
            isActive: true,
            lastUpdated: block.timestamp
        });

        ownerToMicrogridId[msg.sender] = id;

        isRegistered[msg.sender] = true;
        emit MicrogridRegistered(id, msg.sender, _name, _latitude, _longitude);
    }

    function getMyMicrogrid() external view returns (Microgrid memory) {
        require(isRegistered[msg.sender], "Microgrid not registered");
        uint256 id = ownerToMicrogridId[msg.sender];
        return microgrids[id];
    }

    function updateStatus(uint256 _energyGenerated, uint256 _energyDemand, uint256 _batteryLevel) public {
        uint256 _id = ownerToMicrogridId[msg.sender];

        require(isRegistered[msg.sender], "Microgrid not registered");
        require(_id < nextId, "Microgrid does not exist");
        require(microgrids[_id].isActive, "Microgrid is not active");
        require(_batteryLevel <= 100, "Battery level must be between 0 and 100");
        require(
            _energyGenerated <= microgrids[_id].maxCapacity,
            "Energy generated exceeds max capacity"
        );
        require(
            _energyDemand <= microgrids[_id].maxCapacity,
            "Energy demand exceeds max capacity"
        );

        microgrids[_id].energyGenerated = _energyGenerated;
        microgrids[_id].energyDemand = _energyDemand;
        microgrids[_id].batteryLevel = _batteryLevel;

        microgrids[_id].lastUpdated = block.timestamp;

        emit StatusUpdated(
            _id,
            _energyGenerated,
            _energyDemand,
            _batteryLevel,
            block.timestamp
        );
    }

    function getSurplus(uint256 _id) public view returns(int256){
        require(_id < nextId, "Microgrid does not exist");
        require(microgrids[_id].isActive, "Microgrid is not active");
        return int256(microgrids[_id].energyGenerated) - int256(microgrids[_id].energyDemand) - int256(microgrids[_id].reservedEnergy);
    }

    function getAvailableEnergy(uint256 _id) external view returns(uint256){
        require(_id < nextId, "Microgrid does not exist");
        require(microgrids[_id].isActive, "Microgrid is not active");
        int256 availableEnergy = int256(microgrids[_id].energyGenerated) - int256(microgrids[_id].energyDemand) - int256(microgrids[_id].reservedEnergy);
        return availableEnergy > 0 ? uint256(availableEnergy) : 0;
    }

    function getMicrogrid(uint256 _id) public view returns (Microgrid memory) {
        require(_id < nextId, "Microgrid does not exist");
        return microgrids[_id];
    }

    function setMicrogridStatus(bool _status) public {
        require(isRegistered[msg.sender], "Microgrid not registered");
        uint256 _id = ownerToMicrogridId[msg.sender];
        microgrids[_id].isActive = _status;
    }

    function increaseReservedEnergy(uint256 _id, uint256 _amount) external onlyMarketplace {
        require(_id < nextId, "Microgrid does not exist");
        microgrids[_id].reservedEnergy += _amount;

        emit ReservedEnergyUpdated(_id, microgrids[_id].reservedEnergy);
    }

    function decreaseReservedEnergy(uint256 _id, uint256 _amount) external onlyMarketplace {
        require(_id < nextId, "Microgrid does not exist");
        require(microgrids[_id].reservedEnergy >= _amount, "Insufficient reserved energy");
        microgrids[_id].reservedEnergy -= _amount;

        emit ReservedEnergyUpdated(_id, microgrids[_id].reservedEnergy);
    }

    function getPricingData(uint256 _id) external view returns(uint256 generation, uint256 demand, uint256 batteryLevel, uint256 maxCapacity, uint256 reservedEnergy){
        require(_id < nextId, "Microgrid doesn't exist");

        Microgrid storage grid = microgrids[_id];

        return(
            grid.energyGenerated, 
            grid.energyDemand, 
            grid.batteryLevel, 
            grid.maxCapacity, 
            grid.reservedEnergy
        );
    }

    function transferEnergy(uint256 _sellerId, address _buyer, uint256 _amount) external onlyMarketplace {
        require(_sellerId < nextId, "Seller microgrid does not exist");
        require(isRegistered[_buyer], "Buyer is not registered");

        uint256 buyerId = ownerToMicrogridId[_buyer];

        require(
            microgrids[_sellerId].energyGenerated >= _amount,
            "Seller doesn't have enough energy"
        );

        require(
            microgrids[buyerId].energyGenerated + _amount <=
            microgrids[buyerId].maxCapacity,
            "Buyer capacity exceeded"
        );

        // Seller loses energy
        microgrids[_sellerId].energyGenerated -= _amount;

        // Buyer gains energy
        microgrids[buyerId].energyGenerated += _amount;

        microgrids[_sellerId].lastUpdated = block.timestamp;
        microgrids[buyerId].lastUpdated = block.timestamp;
    }
}