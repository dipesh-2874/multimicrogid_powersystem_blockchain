# ⚡ Market-Driven Adaptive Pricing for Peer-to-Peer Energy Trading Over Interconnected Multi-Microgrid Networks with Ethereum Smart Contracts

<p align="center">
  <b>A Decentralized Blockchain-Based Energy Trading Framework</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.28-blue?logo=solidity" />
  <img src="https://img.shields.io/badge/Blockchain-Ethereum-3C3C3D?logo=ethereum" />
  <img src="https://img.shields.io/badge/Smart%20Contracts-Hardhat-yellow?logo=hardhat" />
  <img src="https://img.shields.io/badge/Token-ERC--20-blue" />
  <img src="https://img.shields.io/badge/Network-Sepolia-purple" />
</p>

---

## 📌 Overview

The increasing adoption of renewable energy resources has transformed traditional electricity consumers into **prosumers**—participants who can both generate and consume electrical energy.

However, individual microgrids often experience fluctuations in energy generation and consumption. While one microgrid may have excess energy, another interconnected microgrid may simultaneously face an energy deficit.

This project proposes a **blockchain-powered, decentralized peer-to-peer (P2P) energy trading framework** that enables secure, transparent, and automated energy transactions across interconnected multi-microgrid networks.

The proposed framework integrates Ethereum smart contracts, ERC-20-based energy credits, and a market-driven adaptive pricing mechanism to facilitate efficient energy exchange without relying on centralized intermediaries.

A key feature of the system is its adaptive pricing mechanism, which calculates reference energy prices using:

- Energy demand
- Energy generation and supply
- Grid transfer capacity
- Battery State of Charge (SoC)

Additionally, a smart-contract-enforced **±20% price deviation threshold** ensures that seller-defined prices remain within an acceptable range of the calculated market reference price.

## 🎯 Research Objectives

- Develop an interconnected multi-microgrid architecture for decentralized energy trading.
- Implement a dynamic pricing mechanism responsive to real-time energy conditions.
- Prevent unreasonable seller pricing through smart contract validation.
- Enable transparent energy offer creation, tracking, and lifecycle management.
- Implement tokenized energy credits using the ERC-20 standard.
- Automate energy transactions and payment settlement through Ethereum smart contracts.
- Evaluate the performance of adaptive pricing against fixed-price and demand-based pricing mechanisms.

## 🏗️ System Architecture

The proposed framework consists of three major smart contract modules:

### 1. Energy Token Contract

Implements an ERC-20-compatible token called **Energy Token (ETK)**.

Responsibilities:
- Token minting and distribution.
- Token transfers between participants.
- Approval and allowance management.
- Payment settlement during energy trading.

### 2. Microgrid Registry Contract

Maintains information about registered microgrids and their operational parameters.

Responsibilities:
- Microgrid registration.
- Ownership verification.
- Generation and consumption tracking.
- Battery State of Charge management.
- Available and reserved energy management.
- Microgrid operational status updates.
- Marketplace authorization.

### 3. Marketplace Contract

Acts as the decentralized marketplace connecting energy buyers and sellers.

Responsibilities:
- Energy offer creation.
- Adaptive price validation.
- Offer tracking and management.
- Partial and complete energy purchases.
- Automatic token settlement.
- Energy reservation and release.
- Offer cancellation and expiration.

### System Workflow

1. Microgrids register themselves through the Microgrid Registry.
2. Operational parameters such as generation, consumption, grid capacity, and battery SoC are updated.
3. The pricing mechanism calculates the reference market price.
4. Prosumers create energy offers by specifying the energy quantity and asking price.
5. The Marketplace validates the seller's price against the ±20% deviation threshold.
6. Valid offers are published on the blockchain.
7. Buyers evaluate available offers based on price, energy availability, and microgrid location.
8. Buyers execute transactions using ETK tokens.
9. The smart contracts update the offer status, transfer token payments, and adjust energy balances.

## 💡 Key Features

| Feature | Description |
|---|---|
| Multi-Microgrid Support | Enables energy trading between interconnected microgrids. |
| Adaptive Pricing | Calculates reference prices using operational parameters. |
| Price Deviation Control | Enforces a ±20% seller price tolerance. |
| Decentralized Marketplace | Enables direct peer-to-peer energy offers. |
| ERC-20 Tokenization | Uses ETK for energy transaction settlement. |
| Offer Lifecycle Management | Supports active, partially filled, filled, cancelled, and expired offers. |
| Energy Reservation | Prevents the same surplus energy from being offered multiple times. |
| Automated Settlement | Executes token transfers and energy accounting through smart contracts. |
| Blockchain Transparency | Maintains an auditable record of marketplace transactions. |

## 📊 Adaptive Pricing Mechanism

Unlike conventional fixed-price systems, the proposed model dynamically determines energy prices based on the operational condition of individual microgrids.

The pricing mechanism considers:

- **Demand:** Higher energy demand influences the market reference price.
- **Supply:** Energy surplus and deficit influence market availability.
- **Grid Capacity:** Available transfer capacity affects energy exchange feasibility.
- **Battery SoC:** Battery availability contributes to the pricing adjustment.

The calculated reference price is used to establish an acceptable seller price range.

The validation condition is:

\[
0.8P_{ref} \leq P_{seller} \leq 1.2P_{ref}
\]

Where:

- \(P_{ref}\) = Calculated reference market price.
- \(P_{seller}\) = Seller-proposed energy price.

Offers exceeding this threshold are rejected by the smart contract.

## 🔄 Energy Offer Lifecycle

Each marketplace offer maintains its own lifecycle and state.

| Status | Description |
|---|---|
| ACTIVE | Offer is available for purchase. |
| PARTIALLY_FILLED | A portion of the offered energy has been purchased. |
| FILLED | The entire offered energy quantity has been purchased. |
| CANCELLED | The seller has cancelled the offer. |
| EXPIRED | The offer has passed its expiration deadline. |

The system also maintains:
- Total offered energy.
- Already traded energy.
- Remaining energy.
- Seller address.
- Associated microgrid ID.
- Seller and reference prices.
- Offer creation and expiration timestamps.

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Solidity 0.8.28 | Smart contract development |
| Ethereum | Blockchain infrastructure |
| Hardhat | Smart contract development and testing |
| OpenZeppelin | Secure ERC-20 implementation |
| ERC-20 | Tokenized energy credits |
| JavaScript | Deployment scripts and blockchain interaction |
| Chai | Smart contract testing |
| Ethers.js | Blockchain interaction |
| Ethereum Sepolia | Smart contract deployment and validation |

## 📁 Project Structure

The repository is organized around smart contracts, deployment scripts, testing modules, and supporting simulation components.

```text
project-root/
│
├── contracts/
│   ├── EnergyToken.sol
│   ├── MicrogridRegistry.sol
│   ├── Marketplace.sol
│   └── libraries/
│       └── PricingLibrary.sol
│
├── scripts/
│   ├── deploy.js
│   ├── configureContracts.js
│   └── mintTokens.js
│
├── test/
│   ├── EnergyToken.test.js
│   ├── MicrogridRegistry.test.js
│   ├── Marketplace.test.js
│   └── Integration.test.js
│
├── ignition/
│
├── hardhat.config.js
├── package.json
├── package-lock.json
├── .env.example
└── README.md
```

*Note: Adjust the directory and filename structure according to the actual repository.*

## ⚙️ Installation and Setup

### Prerequisites

Ensure that the following tools are installed:

- Node.js
- npm
- Git
- MetaMask or another Ethereum-compatible wallet

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <PROJECT_DIRECTORY>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```env
SEPOLIA_RPC_URL=YOUR_SEPOLIA_RPC_URL
PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
```

**Security Note:** Never commit your `.env` file or expose private keys, RPC credentials, or other sensitive information.

### 4. Compile Smart Contracts

```bash
npx hardhat compile
```

### 5. Run Tests

```bash
npx hardhat test
```

### 6. Deploy Smart Contracts

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

*Deployment commands may need to be adjusted to match the actual repository scripts and Hardhat configuration.*

## 🧪 Testing and Evaluation

The proposed framework was evaluated using Hardhat and Chai-based unit and integration tests.

### Smart Contract Testing Summary

| Module | Test Cases | Passed |
|---|---:|---:|
| EnergyToken | 4 | 4 |
| MicrogridRegistry | 12 | 12 |
| Marketplace | 25 | 25 |
| Integration | 9 | 9 |
| **Total** | **50** | **50** |

All 50 reported test cases passed successfully.

### Adaptive Pricing Performance

The proposed adaptive pricing mechanism was evaluated against two baseline approaches:

- Fixed Pricing
- Demand-Based Pricing
- Proposed Adaptive Pricing

The simulation considered 30 interconnected microgrids.

| Performance Metric | Fixed Pricing | Demand-Based | Adaptive Pricing |
|---|---:|---:|---:|
| Successful Deals | 17 | 25 | **34** |
| Energy Transferred (kWh) | 2,760 | 3,645 | **5,280** |
| Economic Volume (ETK) | 27,600 | 31,498 | **47,610** |
| Customer Satisfaction | 52.3% | 69.0% | **100%** |
| Active Prosumer Utilization | 27.0% | 35.6% | **51.6%** |
| Mean Energy Price (ETK/kWh) | 10.00 | 8.64 | **9.02** |

The experimental results demonstrate that the adaptive pricing mechanism achieves higher energy trading volume, improved prosumer utilization, and better customer satisfaction compared with the evaluated baseline mechanisms.

## 🔐 Security Considerations

The system incorporates smart contract-level validation and access control mechanisms to support secure decentralized energy trading.

Key considerations include:

- Ownership verification for microgrid operations.
- Marketplace authorization for energy reservation and release.
- Validation of available energy before offer creation.
- Seller price validation through adaptive pricing.
- Offer existence and status verification.
- Automatic handling of expired offers.
- ERC-20 token-based payment settlement.

**Research limitation:** Actual physical energy delivery and smart meter integration require reliable external measurement and verification mechanisms. Blockchain transactions alone do not establish physical electricity delivery.

## 🚀 Future Scope

Potential directions for further development include:

- Integration with IoT-enabled smart meters for real-time energy monitoring.
- Hardware-based microgrid simulation and validation.
- Cross-chain interoperability between independent energy networks.
- Machine-learning-based energy demand and generation forecasting.
- Layer-2 blockchain integration to reduce transaction costs.
- Advanced privacy-preserving energy trading mechanisms.
- Integration with electric vehicle charging and vehicle-to-grid systems.
- Deployment and evaluation in real-world interconnected microgrid environments.

## 👨‍🔬 Research Collaboration

This research work is a collaborative effort between the Department of Computer Science and Engineering at Jalpaiguri Government Engineering College and IIIT Naya Raipur.

**Research Contributors**

- Tiyasa Patra
- Dipesh Das
- Ananya Sinhababu

**Research Supervisors and Collaborators**

- Dr. Ruhul Amin — IIIT Naya Raipur
- Aakanksha Sharma — IIIT Naya Raipur
- Dr. Subhas Barman — Jalpaiguri Government Engineering College

## 📚 Research Publication

**Research Title:**

*Market-Driven Adaptive Pricing for Peer-to-Peer Energy Trading Over Interconnected Multi-Microgrid Networks With Ethereum Smart Contracts.*

The repository contains the implementation associated with this research work.

## 📄 License

This project is intended for academic and research purposes. Add an appropriate open-source license before permitting external reuse or redistribution.

---

<p align="center">
  <b>Building a Decentralized and Sustainable Energy Future ⚡</b>
  <br/>
  Blockchain × Smart Contracts × Renewable Energy
</p>
