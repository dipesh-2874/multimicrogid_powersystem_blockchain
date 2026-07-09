import Layout from "../components/layout/Layout";

function Explore() {
    return (
        <div className="min-h-screen bg-slate-900 text-white p-5">
            <Layout>
                <div className="mt-20 ml-64 flex flex-col gap-5 w-fit">
                    <h1 className="text-3xl font-bold">Explore The Marketplace</h1>
                    <a target="_blank" href="https://sepolia.etherscan.io/address/0x12154D276980E5bA55B9c72166d1604Aede768B1">
                        <button className="bg-blue-600 
                
                            hover:bg-emerald-700 
                            hover:duration-600 
                            hover:ease-in-out
                            hover:scale-[0.99] 
                            
                            text-white px-6 py-3 rounded-lg">
                                Explore
                        </button>
                    </a>
                </div>
            </Layout>
        </div>
    );
}

export default Explore;