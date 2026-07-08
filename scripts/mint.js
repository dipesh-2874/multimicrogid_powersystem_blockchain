const { ethers } = require("hardhat");

async function main() {
    const tokenAddress = "0x1F4C441Ff8bc81EccEA6c294D298326F93749950";
    const recipient = [
        "0x541D16f0246Be1f926Ec162A5C7E98dF0089d43f", 
        "0x828dfD39Ea825a432D5a841C36dab06c55c5049B", 
        "0x13B4F80eCdEAeCa96214320B426420745CA9B4d9",
        "0xfd6ef534067eB07fF3Eea6a21F870BAd1399203A",
        "0x5bEA0b17A7D23e40C3cf6a75B3516315d933752c"
    ];
    const amount = "10000";

    const EnergyToken = await ethers.getContractFactory("EnergyToken");
    const token = EnergyToken.attach(tokenAddress);
    const mintAmount = ethers.utils.parseUnits(amount, 18);

    for (const addr of recipient) {
        const tx = await token.mint(
            addr,
            mintAmount
        );
        await tx.wait();
    }

    console.log(`Minted ${amount} ETK to ${recipient.join(", ")}`);

} 

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});