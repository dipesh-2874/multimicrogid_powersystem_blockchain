// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import './interfaces/IEnergyToken.sol';
import './interfaces/IMicrogridRegistry.sol';
import './PricingLibrary.sol';

contract Marketplace {
    IEnergyToken public energyToken;
    IMicrogridRegistry public registry;

    constructor(address _energyTokenAddress, address _registryAddress) {
        energyToken = IEnergyToken(_energyTokenAddress);
        registry = IMicrogridRegistry(_registryAddress);
    }

    enum OfferStatus {
        ACTIVE,
        PARTIALLY_FILLED,
        FILLED,
        CANCELLED,
        EXPIRED
    }

    struct Offer {
        uint256 offerId;
        uint256 microgridId;

        uint256 totalEnergy; // in kWh
        uint256 remainingEnergy; // in kWh
        uint256 soldEnergy; // in kWh

        uint256 suggestedPrice; // in ETK per kWh (from adaptive pricing)
        uint256 sellingPrice; // in ETK per kWh (set by seller)
        address seller;

        uint256 createdAt; // timestamp
        uint256 updatedAt; // timestamp
        uint256 expiresAt; // timestamp
        OfferStatus status;
    }

    uint256 constant OFFER_EXPIRATION_TIME = 1 days;
    uint256 public nextOfferId;
    mapping(uint256 => Offer) public offers;
    mapping(uint256 => uint256[]) public microgridOffers; // microgridId => offerIds
    mapping(address => uint256[]) public sellerOffers; // seller => offerIds
    mapping(uint256 => uint256) public activeOfferCount; // active offer count per microgrid

    // events
    event OfferCreated(uint256 indexed offerId, uint256 indexed microgridId, uint256 totalEnergy, uint256 suggestedPrice, uint256 sellingPrice, address indexed seller);
    event EnergyPurchased(uint256 indexed offerId, uint256 energyBought, address indexed buyer, uint256 totalCost);
    event OfferCancelled(uint256 indexed offerId, address indexed seller);
    event OfferStatusUpdated(uint256 indexed offerId, OfferStatus newStatus);

    // modifiers
    modifier offerExists(uint256 _offerId) {
        require(_offerId < nextOfferId, "Offer does not exist");
        _;
    }

    modifier onlySeller(uint256 _offerId){
        require(offers[_offerId].seller == msg.sender, "Not the seller of this offer");
        _;
    }

    // functions
    function createOffer(uint256 _microgridId, uint256 _energyAmount, uint256 _pricePerUnit) external {
        require(_energyAmount > 0, "Energy amount must be greater than 0");
        require(_pricePerUnit > 0, "Price per unit must be greater than 0");
        require(registry.getOwner(_microgridId) == msg.sender, "Not the owner of this microgrid");
        require(registry.isMicrogridActive(_microgridId), "Microgrid is not active");
        require(registry.getAvailableEnergy(_microgridId) >= _energyAmount, "Not enough available energy in the microgrid");

        uint256 offerId = nextOfferId++;

        (
            uint256 energyGeneration, 
            uint256 energyDemand, 
            uint256 batteryLevel, 
            uint256 maxCapacity, 
            uint256 reservedEnergy
        ) = registry.getPricingData(_microgridId);

        uint256 suggestedPrice = PricingLibrary.calculatePrice(energyGeneration,energyDemand, batteryLevel, maxCapacity, reservedEnergy);

        uint256 minPrice = (suggestedPrice * 80) / 100;
        uint256 maxPrice = (suggestedPrice * 120) / 100;

        require((_pricePerUnit >= minPrice && _pricePerUnit <= maxPrice), "Price is out of market range");

        registry.increaseReservedEnergy(_microgridId, _energyAmount);
        
        offers[offerId] = Offer({
            offerId: offerId,
            microgridId: _microgridId,
            seller: msg.sender,
            totalEnergy: _energyAmount,
            remainingEnergy: _energyAmount,
            soldEnergy: 0,
            suggestedPrice: suggestedPrice,
            sellingPrice: _pricePerUnit,
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            expiresAt: block.timestamp + OFFER_EXPIRATION_TIME, // offer expires in 1 day
            status: OfferStatus.ACTIVE
        });

        microgridOffers[_microgridId].push(offerId);
        sellerOffers[msg.sender].push(offerId);
        activeOfferCount[_microgridId]++;

        emit OfferCreated(offerId, _microgridId, _energyAmount, suggestedPrice, _pricePerUnit, msg.sender);
    }

    function isOfferOpen(uint256 _offerId) public view returns (bool) {
        OfferStatus status = offers[_offerId].status;

        return (
            status == OfferStatus.ACTIVE ||
            status == OfferStatus.PARTIALLY_FILLED
        );
    }

    function buyEnergy(uint256 _offerId, uint256 _amt) external offerExists(_offerId) {
        Offer storage offer = offers[_offerId];
        if (block.timestamp >= offer.expiresAt) {
            expireOffer(_offerId);
            return;
        }
        require(isOfferOpen(_offerId), "Offer isn't open");
        require(msg.sender != offer.seller, "Seller cannot buy their own energy");
        require(_amt > 0, "Amount must be greater than 0");
        require(offer.remainingEnergy >= _amt, "Not enough energy available in the offer");

        uint256 totalCost = PricingLibrary.calculateCost(offer.sellingPrice, _amt);

        // Check buyer balance
        require(energyToken.balanceOf(msg.sender) >= totalCost, "Insufficient ETK balance");

        // Check Marketplace allowance
        require(energyToken.allowance(msg.sender, address(this)) >= totalCost, "Approve Marketplace to spend your ETK first");

        // Transfer tokens
        require(energyToken.transferFrom(msg.sender, offer.seller, totalCost),"Transfer failed");

        // update offer
        offer.remainingEnergy -= _amt;
        offer.soldEnergy += _amt;

        // release reserved energy
        registry.decreaseReservedEnergy(offer.microgridId, _amt);

        registry.transferEnergy(
            offer.microgridId,
            msg.sender,
            _amt
        );

        // updated time
        offer.updatedAt = block.timestamp;

        // update status
        if(offer.remainingEnergy == 0){
            activeOfferCount[offer.microgridId]--;
            offer.status = OfferStatus.FILLED;
        } else {
            offer.status = OfferStatus.PARTIALLY_FILLED;
        }

        emit OfferStatusUpdated(_offerId, offer.status);
        emit EnergyPurchased(_offerId, _amt, msg.sender, totalCost);
    }

    function cancelOffer(uint256 _offerId) external offerExists(_offerId) onlySeller(_offerId){
        _closeOffer(_offerId, OfferStatus.CANCELLED);
        
        emit OfferCancelled(_offerId,msg.sender);
    }

    function expireOffer(uint256 _offerId) public offerExists(_offerId){
        require(
            offers[_offerId].expiresAt <= block.timestamp,
            "Offer has not expired yet"
        );

        if (!isOfferOpen(_offerId)) {
            return;
        }
        _closeOffer(_offerId, OfferStatus.EXPIRED);
    }

    function _closeOffer(uint256 _offerId, OfferStatus status) internal {
        Offer storage offer = offers[_offerId];
        require(
            isOfferOpen(_offerId),
            "Offer already closed"
        );
        if (offer.remainingEnergy > 0) {
            registry.decreaseReservedEnergy(
                offer.microgridId,
                offer.remainingEnergy
            );
        }

        offer.remainingEnergy = 0;
        offer.status = status;
        offer.updatedAt = block.timestamp;

        activeOfferCount[offer.microgridId]--;

        emit OfferStatusUpdated(_offerId, status);
    }

    // Get a single offer
    function getOffer(uint256 _offerId) external view returns (Offer memory){
        require(_offerId < nextOfferId, "Offer does not exist");
        return offers[_offerId];
    }

    // Get total number of offers
    function getOfferCount()
        external
        view
        returns (uint256)
    {
        return nextOfferId;
    }

    // Get all offer IDs for a microgrid
    function getMicrogridOffers(uint256 _microgridId)
        external
        view
        returns (uint256[] memory)
    {
        return microgridOffers[_microgridId];
    }

    // Get all offer IDs created by a seller
    function getSellerOffers(address _seller)
        external
        view
        returns (uint256[] memory)
    {
        return sellerOffers[_seller];
    }
}