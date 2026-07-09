import { useState } from "react";

import Layout from "../components/layout/Layout";
import CreateOffer from "../components/marketplace/CreateOffer";
import ActiveOffers from "../components/marketplace/ActiveOffers";

function Marketplace() {

    const [refresh, setRefresh] = useState(0);

    return (
      <div className="bg-slate-900 px-5">
        <Layout>
          <div className="mt-20 ml-64">
            <h1 className="text-3xl font-bold mb-6">
              Marketplace
            </h1>
            <CreateOffer
              onSuccess={() => setRefresh(prev => prev + 1)}
            />
            <ActiveOffers
              refresh={refresh}
              setRefresh={setRefresh}
            />
          </div>
        </Layout>
      </div>
    );

}

export default Marketplace;