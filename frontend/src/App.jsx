import { Routes, Route } from "react-router-dom";
import ScrollManager from "./components/ScrollManager";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import RoleSelect from "./pages/RoleSelect";
import OrgDetails from "./pages/OrgDetails";
import Pending from "./pages/Pending";
import DonorDashboard from "./pages/DonorDashboard";
import CreateListing from "./pages/CreateListing";
import RecipientDashboard from "./pages/RecipientDashboard";
import OfferInbox from "./pages/OfferInbox";
import MapView from "./pages/MapView";
import ImpactDashboard from "./pages/ImpactDashboard";
import SimulationResults from "./pages/SimulationResults";

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<RoleSelect />} />
        <Route path="/register/details" element={<OrgDetails />} />
        <Route path="/pending" element={<Pending />} />
        <Route path="/donor" element={<DonorDashboard />} />
        <Route path="/donor/listings/new" element={<CreateListing />} />
        <Route path="/donor/map" element={<MapView role="donor" />} />
        <Route path="/donor/impact" element={<ImpactDashboard role="donor" />} />
        <Route path="/recipient" element={<RecipientDashboard />} />
        <Route path="/recipient/offers" element={<OfferInbox />} />
        <Route path="/recipient/map" element={<MapView role="recipient" />} />
        <Route path="/recipient/impact" element={<ImpactDashboard role="recipient" />} />
        <Route path="/map" element={<MapView role="recipient" />} />
        <Route path="/admin/simulation" element={<SimulationResults />} />
      </Routes>
    </>
  );
}
