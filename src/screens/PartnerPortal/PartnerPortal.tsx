import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { PartnerLayout } from "./PartnerLayout";
import { SendParcelsPage } from "./SendParcelsPage";
import { TrackParcelsPage } from "./TrackParcelsPage";
import { EarningsPage } from "./EarningsPage";
import { HistoryPage } from "./HistoryPage";
import { SettingsPage } from "./SettingsPage";
import { INITIAL_PARCELS, type PartnerParcel } from "./partnerData";

export const PartnerPortal = () => {
  const [parcels, setParcels] = useState<PartnerParcel[]>(INITIAL_PARCELS);
  const navigate = useNavigate();

  const handleNewParcels = (newParcels: PartnerParcel[]) => {
    setParcels(prev => [...newParcels, ...prev]);
    setTimeout(() => navigate("/partner/track"), 1500);
  };

  return (
    <PartnerLayout>
      <Routes>
        <Route index                  element={<SendParcelsPage onSubmit={handleNewParcels} />} />
        <Route path="track"           element={<TrackParcelsPage parcels={parcels} />} />
        <Route path="earnings"        element={<EarningsPage parcels={parcels} />} />
        <Route path="history"         element={<HistoryPage parcels={parcels} />} />
        <Route path="settings"        element={<SettingsPage />} />
        <Route path="*"               element={<Navigate to="/partner" replace />} />
      </Routes>
    </PartnerLayout>
  );
};
