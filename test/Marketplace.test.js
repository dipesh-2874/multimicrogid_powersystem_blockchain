const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Blockchain-based Multi-Microgrid Energy Trading", () => {

    let owner;
    let buyer1;
    let buyer2;
    let seller1;
    let seller2;

    let energyToken;
    let registry;
    let marketplace;

    beforeEach(async () => {
        [owner, seller1, seller2, buyer1, buyer2] = await ethers.getSigners();

        // Deploy the EnergyToken contract
        const EnergyToken = await ethers.getContractFactory("EnergyToken");
        energyToken = await EnergyToken.deploy(owner.address);
        await energyToken.deployed();

        // Deploy Registry
        const Registry = await ethers.getContractFactory("MicrogridRegistry");
        registry = await Registry.deploy(owner.address);
        await registry.deployed();

        // Deploy Marketplace
        const Marketplace = await ethers.getContractFactory("Marketplace");
        marketplace = await Marketplace.deploy(
            energyToken.address,
            registry.address
        );

        await marketplace.deployed();

        // Link Marketplace
        await registry.setMarketplaceAddress(marketplace.address);

        // Mint ETK
        const amount = ethers.utils.parseUnits("10000", 18);
        await energyToken.mint(owner.address, amount);

        await energyToken.mint(buyer1.address, amount);
        await energyToken.mint(buyer2.address, amount);
        await energyToken.mint(seller1.address, amount);
        await energyToken.mint(seller2.address, amount);
    });
    
    /////////////////////////////////////////////////////////
    // Energy Token
    /////////////////////////////////////////////////////////

    describe("EnergyToken", () =>{
        it("Should mint ETK to a user", async () => {
            const amount = ethers.utils.parseUnits("500", 18);
            await energyToken.mint(buyer1.address, amount);
            const balance = await energyToken.balanceOf(buyer1.address);

            expect(balance.toString()).to.equal(
                ethers.utils.parseUnits("10500", 18).toString()
            );
        });

        it("Should burn ETK from an address", async () => {
            const burnAmount = ethers.utils.parseUnits("500", 18);
            await energyToken.burn(buyer1.address, burnAmount);
            const balance = await energyToken.balanceOf(buyer1.address);

            expect(balance.toString()).to.equal(
                ethers.utils.parseUnits("9500", 18).toString()
            );
        });

        it("Should approve Marketplace to spend ETK", async () => {
            const amount = ethers.utils.parseUnits("1000", 18);
            await energyToken
                .connect(buyer1)
                .approve(
                    marketplace.address,
                    amount
                );

            const allowance =
                await energyToken.allowance(
                    buyer1.address,
                    marketplace.address
                );

            expect(allowance.toString()).to.equal(amount.toString());
        });

        it("Should transfer ETK between users", async () => {
            const amount = ethers.utils.parseUnits("100", 18);
            await energyToken
                .connect(buyer1)
                .transfer(
                    buyer2.address,
                    amount
                );

            const balance =
                await energyToken.balanceOf(buyer2.address);

            expect(balance.toString()).to.equal(
                ethers.utils.parseUnits("10100", 18).toString()
            );
        });
    });

    /////////////////////////////////////////////////////////
    // Microgrid Registration
    /////////////////////////////////////////////////////////

    describe("Microgrid Registration", () =>{
        it("Should register a solar microgrid", async () => {
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid A",
                22345678,
                88234567,
                1000
            );

            const grid = await registry.getMicrogrid(0);

            expect(grid.name).to.equal("Solar Grid A");
            expect(grid.owner).to.equal(seller1.address);
            expect(grid.maxCapacity.toNumber()).to.equal(1000);
            expect(grid.isActive).to.equal(true);
        });

        it("Should reject duplicate microgrid registration", async () => {
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid A",
                22345678,
                88234567,
                1000
            );

            let reverted = false;

            try {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid B",
                    22345678,
                    88234567,
                    1000
                );
            } catch (error) {
                reverted = true;
                expect(error.message).to.include(
                    "Microgrid already registered for this owner"
                );
            }

            expect(reverted).to.equal(true);
        });

        it("Should update the status of a registered microgrid", async () => {
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid A",
                22345678,
                88234567,
                1000
            );

            await registry.connect(seller1).updateStatus(
                800,    // generation
                300,    // demand
                75      // battery
            );

            const grid = await registry.getMicrogrid(0);

            expect(grid.energyGenerated.toNumber()).to.equal(800);
            expect(grid.energyDemand.toNumber()).to.equal(300);
            expect(grid.batteryLevel.toNumber()).to.equal(75);
        });

        it("Should calculate available energy correctly", async () => {
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid A",
                22345678,
                88234567,
                1000
            );

            await registry.connect(seller1).updateStatus(
                800,
                300,
                75
            );

            const available =
                await registry.getAvailableEnergy(0);

            expect(available.toNumber()).to.equal(500);
        });

        it("Should calculate surplus correctly", async () => {
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid A",
                22345678,
                88234567,
                1000
            );

            await registry.connect(seller1).updateStatus(
                800,
                300,
                75
            );

            const surplus =
                await registry.getSurplus(0);

            expect(surplus.toNumber()).to.equal(500);
        });

        it("Should return pricing data", async () => {
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid A",
                22345678,
                88234567,
                1000
            );

            await registry.connect(seller1).updateStatus(
                800,
                300,
                75
            );

            const pricing =
                await registry.getPricingData(0);

            expect(pricing.generation.toNumber()).to.equal(800);
            expect(pricing.demand.toNumber()).to.equal(300);
            expect(pricing.batteryLevel.toNumber()).to.equal(75);
            expect(pricing.maxCapacity.toNumber()).to.equal(1000);
            expect(pricing.reservedEnergy.toNumber()).to.equal(0);
        });

        it("Should deactivate microgrid", async () => {
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid A",
                22345678,
                88234567,
                1000
            );

            // Initially active
            expect(await registry.isMicrogridActive(0)).to.equal(true);

            // Deactivate
            await registry.connect(seller1).setMicrogridStatus(
                false
            );

            expect(await registry.isMicrogridActive(0)).to.equal(false);
        });

        it("Should prevent a non-owner from updating the microgrid status", async  () => {
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid A",
                22345678,
                88234567,
                1000
            );

            let reverted = false;

            try {
                await registry.connect(buyer1).updateStatus(
                    800,
                    300,
                    75
                );
            } catch (error) {

                reverted = true;
                expect(error.message).to.include(
                    "Microgrid not registered"
                );
            }

            expect(reverted).to.equal(true);
        });

        it("Should reject invalid battery level", async () => {
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid A",
                22345678,
                88234567,
                1000
            );

            let reverted = false;

            try {
                await registry.connect(seller1).updateStatus(
                    800,
                    300,
                    120
                );
            } catch (error) {

                reverted = true;
                expect(error.message).to.include(
                    "Battery level must be between 0 and 100"
                );
            }

            expect(reverted).to.equal(true);
        });

        it("Should reject generation above max capacity", async  () => {
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid A",
                22345678,
                88234567,
                1000
            );

            let reverted = false;

            try {
                await registry.connect(seller1).updateStatus(
                    1500,
                    300,
                    80
                );
            } catch (error) {

                reverted = true;
                expect(error.message).to.include(
                    "Energy generated exceeds max capacity"
                );
            }

            expect(reverted).to.equal(true);
        });

        it("Should reject demand above max capacity", async () => {
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid A",
                22345678,
                88234567,
                1000
            );

            let reverted = false;

            try {
                await registry.connect(seller1).updateStatus(
                    800,
                    1500,
                    80
                );
            } catch (error) {

                reverted = true;
                expect(error.message).to.include(
                    "Energy demand exceeds max capacity"
                );
            }

            expect(reverted).to.equal(true);
        });

        it("Should return the correct owner of a microgrid", async () => {
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid A",
                22345678,
                88234567,
                1000
            );

            const ownerAddress = await registry.getOwner(0);

            expect(ownerAddress).to.equal(seller1.address);
        });
    });

    //  /////////////////////////////////////////////////////////
    // // Marketplace
    // /////////////////////////////////////////////////////////

    describe("Marketplace", () => {
        describe("Adaptive Pricing", () => {
            it("Should suggest a lower price for high surplus", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    100,
                    90
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    6
                );

                const offer = await marketplace.offers(0);

                expect(
                    offer.suggestedPrice.toNumber()
                ).to.equal(6);
            });

            it("Should suggest a medium price for medium surplus", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    700,
                    300,
                    60
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    100,
                    8
                );

                const offer = await marketplace.offers(0);

                expect(
                    offer.suggestedPrice.toNumber()
                ).to.equal(8);
            });

            it("Should increase the price when energy is low", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    500,
                    400,
                    50
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    50,
                    12
                );

                const offer = await marketplace.offers(0);

                expect(
                    offer.suggestedPrice.toNumber()
                ).to.equal(12);
            });
            
            // A deficit microgrid cannot create an offer because it has no surplus energy available for trading.
            
            // it("deficit + low battery", async () => {
            //     await registry.connect(seller1).registerMicrogrid(
            //         "Solar Grid A",
            //         22345678,
            //         88234567,
            //         1000
            //     );

            //     await registry.connect(seller1).updateStatus(
            //         0,
            //         300,
            //         700,
            //         10
            //     );

            //     await marketplace.connect(seller1).createOffer(
            //         0,
            //         100,
            //         18
            //     );

            //     const offer = await marketplace.offers(0);

            //     expect(
            //         offer.suggestedPrice.toNumber()
            //     ).to.equal(18);
            // });

            it("Should increase suggested price after reserving energy", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );

                // First offer reserves 400 kWh
                await marketplace.connect(seller1).createOffer(
                    0,
                    400,
                    7
                );

                // Second offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    100,
                    9
                );

                const offer1 = await marketplace.offers(0);
                const offer2 = await marketplace.offers(1);

                expect(
                    offer2.suggestedPrice.toNumber()
                ).to.be.greaterThan(
                    offer1.suggestedPrice.toNumber()
                );
            });
        });

        describe("Offer Management", () =>{
            it("Should create an energy offer", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                const offer = await marketplace.offers(0);

                expect(offer.offerId.toNumber()).to.equal(0);
                expect(offer.microgridId.toNumber()).to.equal(0);

                expect(offer.totalEnergy.toNumber()).to.equal(200);
                expect(offer.remainingEnergy.toNumber()).to.equal(200);
                expect(offer.soldEnergy.toNumber()).to.equal(0);

                expect(offer.seller).to.equal(seller1.address);

                expect(offer.sellingPrice.toNumber()).to.equal(8);

                expect(offer.status).to.equal(0);   // ACTIVE
            });

            it("Should reserve energy after creating an offer", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                const grid =
                    await registry.getMicrogrid(0);

                expect(
                    grid.reservedEnergy.toNumber()
                ).to.equal(200);
            });

            it("Should reject offer larger than available energy", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );

                let reverted = false;

                try{
                    await marketplace.connect(seller1).createOffer(
                        0,
                        700,
                        8
                    );
                }catch(error){
                    reverted = true;
                    expect(error.message).to.include(
                        "Not enough available energy"
                    );
                }
                expect(reverted).to.equal(true);
            });

            it("Should reject offer creation by non-owner", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                let reverted = false;
                try{
                    await marketplace.connect(buyer1).createOffer(
                        0,
                        200,
                        8
                    );
                }catch(error){
                    reverted = true;
                    expect(error.message).to.include(
                        "Not the owner of this microgrid"
                    );
                }
                expect(reverted).to.equal(true);
            });

            it("Should reject offer creation for inactive microgrid", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).setMicrogridStatus(
                    false
                );
                let reverted = false;
                try{
                    await marketplace.connect(seller1).createOffer(
                        0,
                        100,
                        8
                    );
                }catch(error){
                    reverted = true;
                    expect(error.message).to.include(
                        "Microgrid is not active"
                    );
                }
                expect(reverted).to.equal(true);
            });

            it("Should cancel an active offer", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                await marketplace.connect(seller1).cancelOffer(0);
                const offer = await marketplace.offers(0);
                expect(offer.status).to.equal(3);          // CANCELLED
                expect(offer.remainingEnergy.toNumber()).to.equal(0);
            });

            it("Should release reserved energy after cancellation", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                let grid = await registry.getMicrogrid(0);
                expect(grid.reservedEnergy.toNumber()).to.equal(200);
                await marketplace.connect(seller1).cancelOffer(0);
                grid = await registry.getMicrogrid(0);
                expect(grid.reservedEnergy.toNumber()).to.equal(0);
            });

            it("Should decrease active offer count after cancellation", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                expect((await marketplace.activeOfferCount(0)).toNumber()).to.equal(1);
                await marketplace.connect(seller1).cancelOffer(0);
                expect((await marketplace.activeOfferCount(0)).toNumber()).to.equal(0);
            });

            it("Should reject cancellation by a non-seller", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );
                let reverted = false;
                try {
                    await marketplace.connect(buyer1).cancelOffer(0);
                } catch (error) {
                    reverted = true;
                    expect(error.message).to.include(
                        "Not the seller of this offer"
                    );
                }
                expect(reverted).to.equal(true);
            });

            it("Should expire an offer", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid A",
                    22345678,
                    88234567,
                    1000
                );
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );
                await network.provider.send(
                    "evm_increaseTime",
                    [86401]
                );
                await network.provider.send(
                    "evm_mine"
                );
                await marketplace.expireOffer(0);
                const offer = await marketplace.offers(0);
                expect(offer.status).to.equal(4);   // EXPIRED
            });
        });

        describe("Energy Trading", () => {
            it("Should buy energy successfully", async () => {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                // Seller status
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                // Create offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                await registry.connect(buyer1).registerMicrogrid(
                    "Buyer Grid",
                    22345679,
                    88234568,
                    1000
                );

                await registry.connect(buyer1).updateStatus(
                    0,
                    0,
                    80
                );
                // Buyer approves Marketplace
                await energyToken.connect(buyer1).approve(
                    marketplace.address,
                    ethers.utils.parseUnits("10000",18)
                );
                // Buy 100 kWh
                await marketplace.connect(buyer1).buyEnergy(
                    0,
                    100
                );
                const offer = await marketplace.offers(0);
                expect(offer.remainingEnergy.toNumber()).to.equal(100);
                expect(offer.soldEnergy.toNumber()).to.equal(100);
            });

            it("Should partially fill an offer", async () => {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                // Seller status
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                // Create offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                await registry.connect(buyer1).registerMicrogrid(
                    "Buyer Grid",
                    22345679,
                    88234568,
                    1000
                );

                await registry.connect(buyer1).updateStatus(
                    0,
                    0,
                    80
                );
                // Buyer approves Marketplace
                await energyToken.connect(buyer1).approve(
                    marketplace.address,
                    ethers.utils.parseUnits("10000",18)
                );
                // Buy 100 kWh
                await marketplace.connect(buyer1).buyEnergy(
                    0,
                    100
                );
                const offer = await marketplace.offers(0);

                expect(offer.remainingEnergy.toNumber()).to.equal(100);
                expect(offer.soldEnergy.toNumber()).to.equal(100);
                expect(offer.status).to.equal(1); // PARTIALLY_FILLED
            });

            it("Should Fully fill an offer", async () => {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                // Seller status
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                // Create offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                await registry.connect(buyer1).registerMicrogrid(
                    "Buyer Grid",
                    22345679,
                    88234568,
                    1000
                );

                await registry.connect(buyer1).updateStatus(
                    0,
                    0,
                    80
                );
                // Buyer approves Marketplace
                await energyToken.connect(buyer1).approve(
                    marketplace.address,
                    ethers.utils.parseUnits("10000",18)
                );
                expect(
                    (await marketplace.activeOfferCount(0)).toNumber()
                ).to.equal(1);

                await marketplace.connect(buyer1).buyEnergy(
                    0,
                    200
                );

                expect(
                    (await marketplace.activeOfferCount(0)).toNumber()
                ).to.equal(0);

                const offer = await marketplace.offers(0);

                expect(offer.remainingEnergy.toNumber()).to.equal(0);
                expect(offer.soldEnergy.toNumber()).to.equal(200);
                expect(offer.status).to.equal(2); // FILLED

                expect(
                    (await marketplace.activeOfferCount(0)).toNumber()
                ).to.equal(0);
            });

            it("Should transfer ETK from buyer to seller", async () => {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                // Seller status
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                // Create offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                await registry.connect(buyer1).registerMicrogrid(
                    "Buyer Grid",
                    22345679,
                    88234568,
                    1000
                );

                await registry.connect(buyer1).updateStatus(
                    0,
                    0,
                    80
                );
                // Buyer approves Marketplace
                await energyToken.connect(buyer1).approve(
                    marketplace.address,
                    ethers.utils.parseUnits("10000",18)
                );
                
                const sellerBefore = await energyToken.balanceOf(seller1.address);
                const buyerBefore = await energyToken.balanceOf(buyer1.address);
                await marketplace.connect(buyer1).buyEnergy(
                    0,
                    100
                );
                const sellerAfter = await energyToken.balanceOf(seller1.address);
                const buyerAfter = await energyToken.balanceOf(buyer1.address);

                expect(
                    sellerAfter.sub(sellerBefore).toString()
                ).to.equal("800");

                expect(
                    buyerBefore.sub(buyerAfter).toString()
                ).to.equal("800");
            });

            it("Should reject purchase without approval", async () => {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                // Seller status
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                // Create offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );
                // no approval
                
                let reverted = false;

                try{
                    await marketplace.connect(buyer1).buyEnergy(
                        0,
                        100
                    );
                }catch(error){
                    reverted = true;
                    expect(error.message).to.include(
                        "Approve Marketplace"
                    );
                }
                expect(reverted).to.equal(true);
            });

            it("Should reject seller buying own offer", async () => {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                // Seller status
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                // Create offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );
                // Buyer approves Marketplace
                await energyToken.connect(buyer1).approve(
                    marketplace.address,
                    ethers.utils.parseUnits("10000",18)
                );

                let reverted = false;

                try{
                    await marketplace.connect(seller1).buyEnergy(
                        0,
                        100
                    );
                }catch(error){
                    reverted = true;
                    expect(error.message).to.include(
                        "Seller cannot buy their own energy"
                    );
                }
                expect(reverted).to.equal(true);
            });

            it("Should reject buying more than available energy", async () => {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                // Seller status
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                // Create offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );
                // Buyer approves Marketplace
                await energyToken.connect(buyer1).approve(
                    marketplace.address,
                    ethers.utils.parseUnits("10000",18)
                );

                let reverted = false;
                try{
                    await marketplace.connect(buyer1).buyEnergy(
                        0,
                        500
                    );
                }catch(error){
                    reverted = true;
                    expect(error.message).to.include(
                        "Not enough energy available"
                    );
                }
                expect(reverted).to.equal(true);
            });

            it("Should decrease reserved energy after purchase", async () => {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                // Seller status
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                // Create offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                await registry.connect(buyer1).registerMicrogrid(
                    "Buyer Grid",
                    22345679,
                    88234568,
                    1000
                );

                await registry.connect(buyer1).updateStatus(
                    0,
                    0,
                    80
                );
                // Buyer approves Marketplace
                await energyToken.connect(buyer1).approve(
                    marketplace.address,
                    ethers.utils.parseUnits("10000",18)
                );

                await marketplace.connect(buyer1).buyEnergy(
                    0,
                    100
                );

                const grid = await registry.getMicrogrid(0);

                expect(grid.reservedEnergy.toNumber()).to.equal(100);
            });
            
            it("Should close an offer after full purchase", async () => {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                // Seller status
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                // Create offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                await registry.connect(buyer1).registerMicrogrid(
                    "Buyer Grid",
                    22345679,
                    88234568,
                    1000
                );

                await registry.connect(buyer1).updateStatus(
                    0,
                    0,
                    80
                );
                // Buyer approves Marketplace
                await energyToken.connect(buyer1).approve(
                    marketplace.address,
                    ethers.utils.parseUnits("10000",18)
                );

                await marketplace.connect(buyer1).buyEnergy(
                    0,
                    200
                );

                expect(
                    await marketplace.isOfferOpen(0)
                ).to.equal(false);
            });

            it("Should reject buying from a filled offer", async () => {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                // Seller status
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                // Create offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                await registry.connect(buyer1).registerMicrogrid(
                    "Buyer Grid",
                    22345679,
                    88234568,
                    1000
                );

                await registry.connect(buyer1).updateStatus(
                    0,
                    0,
                    80
                );
                // Buyer approves Marketplace
                await energyToken.connect(buyer1).approve(
                    marketplace.address,
                    ethers.utils.parseUnits("10000",18)
                );

                await marketplace.connect(buyer1).buyEnergy(
                    0,
                    200
                );

                let reverted = false;
                try{
                    await energyToken.connect(buyer2).approve(
                        marketplace.address,
                        ethers.utils.parseUnits("10000",18)
                    );
                    await marketplace.connect(buyer2).buyEnergy(
                        0,
                        50
                    );
                }catch(error){
                    reverted = true;
                    expect(error.message).to.include(
                        "Offer isn't open"
                    );
                }
                expect(reverted).to.equal(true);
            });

            it("Should automatically expire an offer when purchase is attempted after expiry", async () => {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                // Create offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );
                // Buyer registers
                await registry.connect(buyer1).registerMicrogrid(
                    "Buyer Grid",
                    22345679,
                    88234568,
                    1000
                );
                await registry.connect(buyer1).updateStatus(
                    0,
                    0,
                    80
                );
                // Approve ETK
                await energyToken.connect(buyer1).approve(
                    marketplace.address,
                    ethers.utils.parseUnits("10000", 18)
                );
                // Expire offer
                await network.provider.send(
                    "evm_increaseTime",
                    [86401]
                );
                await network.provider.send("evm_mine");
                // Attempt purchase
                await marketplace.connect(buyer1).buyEnergy(
                    0,
                    100
                );

                const offer = await marketplace.offers(0);

                expect(offer.status).to.equal(4); // EXPIRED
                expect(offer.remainingEnergy.toNumber()).to.equal(0);
                expect(offer.soldEnergy.toNumber()).to.equal(0);
                expect(
                    await marketplace.isOfferOpen(0)
                ).to.equal(false);
                expect(
                    (await marketplace.activeOfferCount(0)).toNumber()
                ).to.equal(0);
            });

            it("Should allow calling expireOffer multiple times safely", async () => {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );
                await network.provider.send(
                    "evm_increaseTime",
                    [86401]
                );
                await network.provider.send("evm_mine");
                await marketplace.expireOffer(0);
                await marketplace.expireOffer(0);
                const offer =
                    await marketplace.offers(0);
                expect(offer.status).to.equal(4);
            });

            it("Should reject purchase with insufficient ETK balance", async () => {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );
                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                // Burn all buyer tokens
                await energyToken.burn(
                    buyer1.address,
                    ethers.utils.parseUnits("10000",18)
                );
                await energyToken.connect(buyer1).approve(
                    marketplace.address,
                    ethers.utils.parseUnits("10000",18)
                );

                let reverted = false;
                try{
                    await marketplace.connect(buyer1).buyEnergy(
                        0,
                        100
                    );
                }catch(error){
                    reverted = true;
                    expect(error.message).to.include(
                        "Insufficient ETK balance"
                    );
                }

                expect(reverted).to.equal(true);
            });

            it("Should transfer energy from seller microgrid to buyer microgrid", async function () {
                // Register seller
                await registry.connect(seller1).registerMicrogrid(
                    "Seller Grid",
                    22345678,
                    88234567,
                    1000
                );
                // Register buyer
                await registry.connect(buyer1).registerMicrogrid(
                    "Buyer Grid",
                    22345679,
                    88234568,
                    1000
                );
                // Seller status
                await registry.connect(seller1).updateStatus(
                    500,
                    200,
                    80
                );
                // Buyer status
                await registry.connect(buyer1).updateStatus(
                    0,
                    0,
                    80
                );
                // Create offer
                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );
                // Approve ETK
                await energyToken.connect(buyer1).approve(
                    marketplace.address,
                    ethers.utils.parseUnits("10000", 18)
                );
                // Buy 180 kWh
                await marketplace.connect(buyer1).buyEnergy(
                    0,
                    180
                );
                const seller = await registry.getMicrogrid(0);
                const buyer = await registry.getMicrogrid(1);

                expect(seller.energyGenerated.toNumber()).to.equal(320);
                expect(buyer.energyGenerated.toNumber()).to.equal(180);
            });
        });

        describe("Read Functions", () => {
            it("Should return an offer by its ID", async function () {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                const offer = await marketplace.getOffer(0);

                expect(offer.offerId.toNumber()).to.equal(0);
                expect(offer.seller).to.equal(seller1.address);
                expect(offer.totalEnergy.toNumber()).to.equal(200);
                expect(offer.sellingPrice.toNumber()).to.equal(8);

            });

            it("Should return total number of offers", async function () {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                expect(
                    (await marketplace.getOfferCount()).toNumber()
                ).to.equal(1);

            });

            it("Should return all offers of a microgrid", async function () {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                const offers =
                    await marketplace.getMicrogridOffers(0);

                expect(offers.length).to.equal(1);
                expect(offers[0].toNumber()).to.equal(0);

            });

            it("Should return all offers created by a seller", async function () {
                await registry.connect(seller1).registerMicrogrid(
                    "Solar Grid",
                    22345678,
                    88234567,
                    1000
                );

                await registry.connect(seller1).updateStatus(
                    900,
                    300,
                    80
                );

                await marketplace.connect(seller1).createOffer(
                    0,
                    200,
                    8
                );

                const offers =
                    await marketplace.getSellerOffers(
                        seller1.address
                    );

                expect(offers.length).to.equal(1);
                expect(offers[0].toNumber()).to.equal(0);

            });
        });
    });

    // /////////////////////////////////////////////////////////
    // // Integration
    // /////////////////////////////////////////////////////////

    describe("Integration", function(){
        it("Should complete an end-to-end energy trade", async function () {
            // Register
            await registry.connect(seller1).registerMicrogrid(
                "Solar Grid",
                22345678,
                88234567,
                1000
            );

            // Update
            await registry.connect(seller1).updateStatus(
                900,
                400,
                80
            );

            // Offer
            await marketplace.connect(seller1).createOffer(
                0,
                200,
                8
            );

            await registry.connect(buyer1).registerMicrogrid(
                "Buyer Grid",
                22345679,
                88234568,
                1000
            );

            await registry.connect(buyer1).updateStatus(
                0,
                0,
                80
            );
            // Approve
            await energyToken.connect(buyer1).approve(
                marketplace.address,
                ethers.utils.parseUnits("10000",18)
            );

            const sellerBefore = await energyToken.balanceOf(seller1.address);

            // Buy
            await marketplace.connect(buyer1).buyEnergy(
                0,
                180
            );

            const sellerAfter = await energyToken.balanceOf(seller1.address);
            const offer = await marketplace.offers(0);
            const grid = await registry.getMicrogrid(0);
            const sellerGrid = await registry.getMicrogrid(0);
            const buyerGrid = await registry.getMicrogrid(1);

            expect(sellerGrid.energyGenerated.toNumber()).to.equal(720);
            expect(buyerGrid.energyGenerated.toNumber()).to.equal(180);

            expect(
                sellerAfter.sub(sellerBefore).toString()
            ).to.equal("1440");
            expect(offer.remainingEnergy.toNumber()).to.equal(20);
            expect(offer.soldEnergy.toNumber()).to.equal(180);
            expect(offer.status).to.equal(1);
            expect(grid.reservedEnergy.toNumber()).to.equal(20);
            expect(
                (await registry.getAvailableEnergy(0)).toNumber()
            ).to.equal(300);
        });

        it("Should support multiple microgrids trading simultaneously", async function () {
            // Seller1 Grid
            await registry.connect(seller1).registerMicrogrid(
                "Grid A",
                22345678,
                88234567,
                1000
            );

            await registry.connect(seller1).updateStatus(
                900,
                300,
                80
            );

            // Seller2 Grid
            await registry.connect(seller2).registerMicrogrid(
                "Grid B",
                22345679,
                88234568,
                1000
            );

            await registry.connect(seller2).updateStatus(
                800,
                200,
                75
            );

            // Offers
            await marketplace.connect(seller1).createOffer(
                0,
                200,
                8
            );

            await marketplace.connect(seller2).createOffer(
                1,
                300,
                8
            );

            await registry.connect(buyer1).registerMicrogrid(
                "Buyer Grid",
                22345679,
                88234568,
                1000
            );

            await registry.connect(buyer1).updateStatus(
                0,
                0,
                80
            );
            // Buyers approve
            await energyToken.connect(buyer1).approve(
                marketplace.address,
                ethers.utils.parseUnits("10000",18)
            );

            await registry.connect(buyer2).registerMicrogrid(
                "Buyer Grid 2",
                22345680,
                88234569,
                1000
            );

            await registry.connect(buyer2).updateStatus(
                0,
                0,
                80
            );
            await energyToken.connect(buyer2).approve(
                marketplace.address,
                ethers.utils.parseUnits("10000",18)
            );

            // Purchases
            await marketplace.connect(buyer1).buyEnergy(
                0,
                100
            );

            await marketplace.connect(buyer2).buyEnergy(
                1,
                150
            );

            const offer1 = await marketplace.offers(0);
            const offer2 = await marketplace.offers(1);

            expect(offer1.remainingEnergy.toNumber()).to.equal(100);
            expect(offer2.remainingEnergy.toNumber()).to.equal(150);
        });
    });

});

