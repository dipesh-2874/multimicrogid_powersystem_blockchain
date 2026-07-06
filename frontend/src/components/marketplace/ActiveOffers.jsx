import { useEffect, useState } from "react";
import { useWallet } from "../../hooks/useWallet";
import BuyEnergy from "./BuyEnergy";
import CancelOffer from "./CancelOffer";

function ActiveOffers({ refresh }) {
    const { marketplace, account } = useWallet();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadOffers() {
            if (!marketplace) return;
            try {
                const count = Number(await marketplace.getOfferCount());
                const data = [];
                for (let i = 0; i < count; i++) {
                    const offer = await marketplace.getOffer(i);
                    if(offer.status.toString() !== "0" && offer.status.toString() !== "1") continue;
                    data.push(offer);
                }

                setOffers(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        loadOffers();
    }, [marketplace, refresh]);

    if (loading) return <p>Loading offers...</p>;

    return (
        <div className="bg-slate-800 p-6 rounded-lg mt-6">
            <h2 className="text-2xl font-bold mb-4">
                Active Offers
            </h2>

            {
                offers.length === 0
                ?
                <p>No offers available.</p>
                :
                offers.map((offer) => (

                    <div
                        key={offer.offerId.toString()}
                        className="border border-slate-600 rounded-lg p-4 mb-4"
                    >
                        <p><strong>Offer ID:</strong> {offer.offerId.toString()}</p>
                        <p><strong>Seller:</strong> {offer.seller}</p>
                        <p><strong>Energy:</strong> {offer.remainingEnergy.toString()} / {offer.totalEnergy.toString()} kWh</p>
                        <p><strong>Price:</strong> {offer.sellingPrice.toString()} ETK</p>
                        <p><strong>Status:</strong> {offer.status.toString()}</p>
                        {
                            offer.seller.toLowerCase() === account.toLowerCase()
                            ?
                            <CancelOffer
                                offerId={offer.offerId}
                                onSuccess={() => refresh}
                            />
                            :
                            <BuyEnergy
                                offer={offer}
                                onSuccess={() => refresh}
                            />
                        }
                    </div>
                ))
            }
        </div>
    );
}

export default ActiveOffers;