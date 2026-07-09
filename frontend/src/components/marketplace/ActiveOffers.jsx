import { useEffect, useState } from "react";
import { useWallet } from "../../hooks/useWallet";
import BuyEnergy from "./BuyEnergy";
import CancelOffer from "./CancelOffer";

function ActiveOffers({ refresh, setRefresh }) {

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
                    let offer = await marketplace.getOffer(i);
                    // Automatically expire offers
                    if (
                        (offer.status.toString() === "0" ||
                            offer.status.toString() === "1") &&
                        Date.now() / 1000 >= Number(offer.expiresAt)
                    ) {
                        try {
                            const tx = await marketplace.expireOffer(i);
                            await tx.wait();
                            offer = await marketplace.getOffer(i);
                        } catch (err) {
                            console.log(err);
                        }
                    }
                    // Hide cancelled offers only
                    if (offer.status.toString() !== "3") {
                        data.push(offer);
                    }
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
                Marketplace Offers
            </h2>

            {
                offers.length === 0 ?

                    <p>No offers available.</p>

                    :

                    offers.map((offer) => {

                        const status = Number(offer.status);

                        let statusText = "";
                        let statusColor = "";
                        let cardColor = "";

                        switch (status) {

                            case 0:
                                statusText = " Active";
                                statusColor = "text-green-400";
                                cardColor = "border-green-500";
                                break;

                            case 1:
                                statusText = " Partially Filled";
                                statusColor = "text-yellow-400";
                                cardColor = "border-yellow-500";
                                break;

                            case 2:
                                statusText = " Filled";
                                statusColor = "text-blue-400";
                                cardColor = "border-blue-500";
                                break;

                            case 4:
                                statusText = " Expired";
                                statusColor = "text-red-400";
                                cardColor = "border-red-500 opacity-70";
                                break;

                            default:
                                statusText = "Unknown";
                                statusColor = "text-white";
                                cardColor = "border-slate-600";
                        }

                        return (

                            <div
                                key={offer.offerId.toString()}
                                className={`border ${cardColor} rounded-lg p-4 mb-4`}
                            >

                                <p>
                                    <strong>Offer ID:</strong>{" "}
                                    {offer.offerId.toString()}
                                </p>

                                <p>
                                    <strong>Seller:</strong>{" "}
                                    {offer.seller}
                                </p>

                                <p>
                                    <strong>Energy:</strong>{" "}
                                    {offer.remainingEnergy.toString()}
                                    {" / "}
                                    {offer.totalEnergy.toString()} kWh
                                </p>

                                <p>
                                    <strong>Price:</strong>{" "}
                                    {offer.sellingPrice.toString()} ETK
                                </p>

                                <p>
                                    <strong>Status:</strong>{" "}
                                    <span className={`font-semibold ${statusColor}`}>
                                        {statusText}
                                    </span>
                                </p>

                                <p>
                                    <strong>Expires At:</strong>{" "}
                                    {
                                        new Date(
                                            Number(offer.expiresAt) * 1000
                                        ).toLocaleString()
                                    }
                                </p>

                                {
                                    (status === 0 || status === 1) &&
                                    (offer.seller.toLowerCase() === account.toLowerCase()
                                        ?
                                        <CancelOffer
                                            offerId={offer.offerId}
                                            onSuccess={() =>
                                                setRefresh(prev => prev + 1)
                                            }
                                        />
                                        :
                                        <BuyEnergy
                                            offer={offer}
                                            onSuccess={() =>
                                                setRefresh(prev => prev + 1)
                                            }
                                        />
                                    )
                                }
                            </div>
                        );
                    })
            }
        </div>
    );
}

export default ActiveOffers;