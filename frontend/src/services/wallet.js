import { ethers } from "ethers";
import { getContracts } from "./blockchain";

export async function initializeWallet() {
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    const signer = await browserProvider.getSigner();
    const account = await signer.getAddress();
    const network = await browserProvider.getNetwork();
    const contracts = getContracts(signer);
    const rawBalance = await contracts.energyToken.balanceOf(account);

    return {
        provider: browserProvider,
        signer,
        account,
        chainId: Number(network.chainId),
        balance: ethers.formatUnits(rawBalance, 18),
        ...contracts,
    };
}