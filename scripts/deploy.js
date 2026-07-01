const {ether} = require("hardhat");

async function main() {
    const [owner, seller1, seller2, buyer1, buyer2] = await ethers.getSigners();

    console.log("Deployer:", owner.address);

    // deploy ETK token
    const ETK = await ethers.getContractFactory("EnergyToken");
    const etk = await ETK.deploy(owner.address);
    await etk.waitForDeployment();

    console.log("EnergyToken:", await etk.getAddress());

    // deploy MicrogridRegistry
    const MicrogridRegistry = await ethers.getContractFactory("MicrogridRegistry");
    const registry = await MicrogridRegistry.deploy(owner.address, await etk.getAddress());
    await registry.waitForDeployment();

    console.log("MicrogridRegistry:", await registry.getAddress());

    // deploy marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(await etk.getAddress(), await registry.getAddress());
    await marketplace.waitForDeployment();

    console.log("Marketplace:", await marketplace.getAddress());

    // connect registry to marketplace
    await registry.setMarketplaceAddress(await marketplace.getAddress());

    console.log("Marketplace linked successfully.");

    // Mint ETK
    const mintAmount = ethers.parseUnits("10000", 18); // 10000 ETK
    await etk.mint(seller1.address, mintAmount);
    await etk.mint(seller2.address, mintAmount);
    await etk.mint(buyer1.address, mintAmount);
    await etk.mint(buyer2.address, mintAmount);

    console.log("Minted 10000 ETK to sellers and buyers.");

    console.log("Deployment completed.");
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});