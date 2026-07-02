import WalletButton from "../components/WalletButton";
import { useWallet } from "../hooks/useWallet";

function Home() {

    const { account, balance, chainId } = useWallet();

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-center items-center gap-8">
            <h1 className="text-5xl font-bold">Blockchain Energy Marketplace</h1>
            <WalletButton />
            {
                account && (
                    <div className="bg-slate-800 p-6 rounded-xl w-112.5">
                        <p>
                            <strong>Wallet:</strong>
                        </p>
                        <p className="break-all">
                            {account}
                        </p>
                        <br />
                        <p>
                            <strong>ETK Balance:</strong>
                            {" "}
                            {balance}
                        </p>
                        <br />
                        <p>
                            <strong>Network:</strong>
                            {" "}
                            {chainId === 11155111
                                ? "🟢 Sepolia"
                                : "🔴 Wrong Network"}
                        </p>
                    </div>
                )
            }
        </div>
    );
}

export default Home;