import { useNavigate } from "react-router-dom";
import { useWallet } from "../../hooks/useWallet";

function Navbar() {
    const navigate = useNavigate();
    const { account } = useWallet();
    return (
        <nav className="h-20 w-full bg-slate-900 border-b border-slate-700 flex items-center justify-between px-8 fixed z-1000">
            <h1 className="text-xl font-bold text-cyan-400">
                ⚡ Energy Trading
            </h1>
            <div className="text-sm text-white flex flex-row justify-between gap-4 items-center">
                {
                    account
                        ? `${account.slice(0, 6)}...${account.slice(-4)}`
                        : "Wallet Not Connected"
                }
                <button 
                onClick = {() => navigate("/")}
                className="text-sm px-2 py-1 rounded-md border-2 border-emerald-300 text-emerald-300 font-bold
                            hover:bg-emerald-300
                            hover:text-slate-900
                            hover:duration-500
                            hover:ease-in-out">
                    Back
                </button>
            </div>
        </nav>
    );
}

export default Navbar;