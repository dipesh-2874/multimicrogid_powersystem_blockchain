import { createContext, useEffect, useState } from "react";
import { initializeWallet } from "../services/wallet";

export const WalletContext = createContext();

export function WalletProvider({ children }) {

    // Wallet
    const [account, setAccount] = useState("");
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [chainId, setChainId] = useState(null);

    // Contracts
    const [energyToken, setEnergyToken] = useState(null);
    const [registry, setRegistry] = useState(null);
    const [marketplace, setMarketplace] = useState(null);

    // Token Balance
    const [balance, setBalance] = useState("0");

    // ----------------------------
    // Update all wallet state
    // ----------------------------
    const updateWalletState = (wallet) => {

        setProvider(wallet.provider);
        setSigner(wallet.signer);

        setAccount(wallet.account);
        setChainId(wallet.chainId);

        setBalance(wallet.balance);

        setEnergyToken(wallet.energyToken);
        setRegistry(wallet.registry);
        setMarketplace(wallet.marketplace);

    };

    // ----------------------------
    // Connect Wallet
    // ----------------------------
    const connectWallet = async () => {

        if (!window.ethereum) {
            alert("Please install MetaMask.");
            return;
        }

        try {

            await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            const wallet = await initializeWallet();

            updateWalletState(wallet);

        } catch (error) {
            console.error(error);
        }

    };

    // ----------------------------
    // Listen to MetaMask
    // ----------------------------
    useEffect(() => {

        if (!window.ethereum) return;

        async function checkConnection() {

            const accounts = await window.ethereum.request({
                method: "eth_accounts",
            });

            if (accounts.length > 0) {

                const wallet = await initializeWallet();

                updateWalletState(wallet);

            }

        }

        checkConnection();

        const handleAccountsChanged = async (accounts) => {

            if (accounts.length === 0) {

                setAccount("");
                setProvider(null);
                setSigner(null);

                setEnergyToken(null);
                setRegistry(null);
                setMarketplace(null);

                setBalance("0");

                return;
            }

            const wallet = await initializeWallet();

            updateWalletState(wallet);

        };

        const handleChainChanged = async () => {

            const wallet = await initializeWallet();

            updateWalletState(wallet);

        };

        window.ethereum.on(
            "accountsChanged",
            handleAccountsChanged
        );

        window.ethereum.on(
            "chainChanged",
            handleChainChanged
        );

        return () => {

            window.ethereum.removeListener(
                "accountsChanged",
                handleAccountsChanged
            );

            window.ethereum.removeListener(
                "chainChanged",
                handleChainChanged
            );

        };

    }, []);

    return (
        <WalletContext.Provider
            value={{

                account,
                provider,
                signer,
                chainId,

                balance,

                energyToken,
                registry,
                marketplace,

                connectWallet,

            }}
        >
            {children}
        </WalletContext.Provider>
    );

}