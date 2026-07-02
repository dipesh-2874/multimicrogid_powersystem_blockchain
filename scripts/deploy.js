const { ethers } = require("hardhat");

async function main() {

    const [owner] = await ethers.getSigners();

    console.log("Deployer:", owner.address);

    // ----------------------------
    // Deploy EnergyToken
    // ----------------------------
    const EnergyToken = await ethers.getContractFactory("EnergyToken");

    const energyToken = await EnergyToken.deploy(owner.address);

    await energyToken.deployed();

    console.log("EnergyToken:", energyToken.address);

    // ----------------------------
    // Deploy MicrogridRegistry
    // ----------------------------
    const Registry = await ethers.getContractFactory("MicrogridRegistry");

    const registry = await Registry.deploy(owner.address);

    await registry.deployed();

    console.log("MicrogridRegistry:", registry.address);

    // ----------------------------
    // Deploy Marketplace
    // ----------------------------
    const Marketplace = await ethers.getContractFactory("Marketplace");

    const marketplace = await Marketplace.deploy(
        energyToken.address,
        registry.address
    );

    await marketplace.deployed();

    console.log("Marketplace:", marketplace.address);

    // ----------------------------
    // Link Marketplace
    // ----------------------------
    await registry.setMarketplaceAddress(
        marketplace.address
    );

    console.log("Marketplace linked successfully.");

    console.log("\n========== DEPLOYMENT COMPLETE ==========");
    console.log("EnergyToken        :", energyToken.address);
    console.log("MicrogridRegistry  :", registry.address);
    console.log("Marketplace        :", marketplace.address);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});