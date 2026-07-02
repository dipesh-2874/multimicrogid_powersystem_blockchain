const { ethers } = require("hardhat");

async function main() {
    const tokenAddress = "0xBbc5079A97312a982E99A9C818779A5ddB78CE58";
    const recipient = "0x828dfD39Ea825a432D5a841C36dab06c55c5049B";
    const amount = "10000";

    const EnergyToken = await ethers.getContractFactory("EnergyToken");
    const token = EnergyToken.attach(tokenAddress);
    const mintAmount = ethers.utils.parseUnits(amount, 18);

    const tx = await token.mint(
        recipient,
        mintAmount
    );

    await tx.wait();

    console.log(
        `Minted ${amount} ETK to ${recipient}`
    );

}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});