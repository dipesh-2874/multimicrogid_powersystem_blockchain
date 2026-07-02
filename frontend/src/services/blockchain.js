import { ethers } from "ethers";

import EnergyToken from "../abi/EnergyToken.json";
import Marketplace from "../abi/Marketplace.json";
import MicrogridRegistry from "../abi/MicrogridRegistry.json";

import {
    ENERGY_TOKEN,
    MARKETPLACE,
    MICROGRID_REGISTRY,
} from "../contracts/addresses";

export function getContracts(signer) {
    return {
        energyToken: new ethers.Contract(
            ENERGY_TOKEN,
            EnergyToken.abi,
            signer
        ),

        registry: new ethers.Contract(
            MICROGRID_REGISTRY,
            MicrogridRegistry.abi,
            signer
        ),

        marketplace: new ethers.Contract(
            MARKETPLACE,
            Marketplace.abi,
            signer
        ),
    };
}