import { useWallet } from "../hooks/useWallet";
import '../index.css'

function WalletButton() {

    const { account, connectWallet } = useWallet();
    console.log("WalletButton account:", account);

    return (
        <button
            onClick={connectWallet}
            className="bg-blue-600 
            
            hover:bg-emerald-700 
            hover:duration-600 
            hover:ease-in-out
            hover:scale-[0.99] 
            
            text-white px-6 py-3 rounded-lg"
        >
            {
                account
                ? `${account.slice(0,6)}...${account.slice(-4)}`
                : "Connect Wallet"
            }
        </button>
    );
}

export default WalletButton;