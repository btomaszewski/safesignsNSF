import React, { useEffect, useState } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import Header from "./components/Header";
import MapComponent from "./components/MapComponent";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import AddHazardModal from "./components/AddHazardModal";
import HelpModal from './components/HelpModal';
import { AuthProvider } from "./components/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BrowserRouter } from "react-router-dom";

interface HazardData {
  category: string;
  subcategory: string;
  description: string;
  date: string;
  media: File[];
}

interface LayerInfo {
  id: number;
  name: string;
  url: string;
}

const App: React.FC = () => {
  const featureServiceUrl =
    "https://services2.arcgis.com/RQcpPaCpMAXzUI5g/arcgis/rest/services/DeafMap_New_Test_Version/FeatureServer";

  const [isAddingHazard, setIsAddingHazard] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAddHazardModalOpen, setIsAddHazardModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  const [hazardData, setHazardData] = useState<HazardData | null>(null);

  const [allLayers, setAllLayers] = useState<LayerInfo[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHelpModalOpen(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleShowHelpModal = () => {
    setIsHelpModalOpen(true);
  };

  const handleCloseHelpModal = () => {
    setIsHelpModalOpen(false);
  };

  const resetHazardData = () => {
    setHazardData(null);
  };

  const handleHazardDataChange = (data: HazardData) => {
    setHazardData(data);
  };

  const handleLoginBtnClicked = () => {
    setIsLoginModalOpen(true);
  };

  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false);
  };

  const handleAddHazardBtnClicked = () => {
    setIsAddingHazard(true);
  };

  const handleCancellAddHazardPoint = () => {
    setIsAddingHazard(false);
  };

  const handleAddHazardModalOpen = () => {
    setIsAddHazardModalOpen(true);
  };

  const handleAddHazardModalClose = () => {
    setIsAddingHazard(false);
    setIsAddHazardModalOpen(false);
  };

  const handleSubmitHazard = (data: HazardData) => {
    setHazardData(data);
  };

  return (
    <>
      <BrowserRouter>
        <AuthProvider>
          <CssBaseline />
          <div className="flex flex-col min-h-screen">
            <Header
              onLoginBtnClick={handleLoginBtnClicked}
              onAddHazardBtnClick={handleAddHazardBtnClicked}
              onHelpBtnClick={handleShowHelpModal}
              isAddingHazardPoint={isAddingHazard}
            />

            <main
              className="flex-grow"
              style={{ height: "calc(100vh - 64px - 50px)" }}
            >
              <MapComponent
                featureServiceUrl={featureServiceUrl}
                isAddHazardBtnClicked={isAddingHazard}
                openAddHazardModal={handleAddHazardModalOpen}
                hazardData={hazardData}
                resetHazardData={resetHazardData}
                setAllLayers={setAllLayers}
                cancelAddHazardPoint={handleCancellAddHazardPoint}
              />
            </main>

            {isHelpModalOpen && (
              <HelpModal
                isOpen={isHelpModalOpen}
                onClose={handleCloseHelpModal}
              />
            )}

            {isLoginModalOpen && (
              <LoginModal
                isOpen={isLoginModalOpen}
                onClose={handleLoginModalClose}
              />
            )}

            {isAddHazardModalOpen && (
              <AddHazardModal
                isOpen={isAddHazardModalOpen}
                onHazardDataChange={handleHazardDataChange}
                allLayers={allLayers}
                onSubmitHazard={handleSubmitHazard}
                resetHazardData={resetHazardData}
                onClose={handleAddHazardModalClose}
              />
            )}

            <Footer />
          </div>
          <ToastContainer
            position="bottom-center"
            autoClose={2000}
            hideProgressBar={false}
          />
        </AuthProvider>
      </BrowserRouter>
    </>
  );
};

export default App;
