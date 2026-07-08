require("@nomiclabs/hardhat-ethers");
require("solidity-coverage");
require("dotenv").config();
require("hardhat-gas-reporter")

const {SEPOLIA_RPC_URL, METAMASK_PRIVATE_KEY} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.28",
    networks: {
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [METAMASK_PRIVATE_KEY]
        }
    },
    gasReporter: {
        enabled: true,
        gasPrice: 2,
        noColors: true,
    },
};