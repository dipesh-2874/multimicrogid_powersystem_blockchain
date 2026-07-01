const { ethers } = require("hardhat");

async function main() {
    const [owner, seller1, seller2, buyer1, buyer2] = await ethers.getSigners();

    console.log("Deployer:", owner.address);

    // deploy ETK token
    const ETK = await ethers.getContractFactory("EnergyToken");
    const etk = await ETK.deploy(owner.address);
    await etk.deployed();

    console.log("EnergyToken:", etk.address);

    // deploy MicrogridRegistry
    const MicrogridRegistry = await ethers.getContractFactory("MicrogridRegistry");
    const registry = await MicrogridRegistry.deploy(owner.address);
    await registry.deployed();

    console.log("MicrogridRegistry:", registry.address);

    // deploy marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(etk.address, registry.address);
    await marketplace.deployed();

    console.log("Marketplace:", marketplace.address);

    // connect registry to marketplace
    const tx = await registry.setMarketplaceAddress(marketplace.address);
    await tx.wait();

    console.log("Marketplace linked successfully.");

    // Mint ETK
    const mintAmount = ethers.utils.parseUnits("10000", 18); // 10000 ETK
    await (await etk.mint(seller1.address, mintAmount)).wait();
    await (await etk.mint(seller2.address, mintAmount)).wait();
    await (await etk.mint(buyer1.address, mintAmount)).wait();
    await (await etk.mint(buyer2.address, mintAmount)).wait();

    console.log("Minted 10000 ETK to sellers and buyers.");

    console.log("Deployment completed.");
    console.log("\n========== Contract Addresses ==========");
    console.log("EnergyToken       :", etk.address);
    console.log("MicrogridRegistry :", registry.address);
    console.log("Marketplace       :", marketplace.address);
    console.log("========================================");
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});