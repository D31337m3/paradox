import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import Navbar               from "./components/Navbar.jsx";
import PanelWindow          from "./components/PanelWindow.jsx";
import Hero                 from "./components/Hero.jsx";
import LiveStats            from "./components/LiveStats.jsx";
import EpochSection         from "./components/EpochSection.jsx";
import ParticipantDashboard from "./components/ParticipantDashboard.jsx";
import Manifesto            from "./components/Manifesto.jsx";
import Tokenomics           from "./components/Tokenomics.jsx";
import BurnNFTs             from "./components/BurnNFTs.jsx";
import NFTPreviews          from "./components/NFTPreviews.jsx";
import MyBurnNFTs           from "./components/MyBurnNFTs.jsx";
import TradeLinks           from "./components/TradeLinks.jsx";
import ShareLinks           from "./components/ShareLinks.jsx";
import ChatCTA              from "./components/ChatCTA.jsx";
import Chat                 from "./components/Chat.jsx";
import SecurityStatus       from "./components/SecurityStatus.jsx";
import BeliefMetrics        from "./components/BeliefMetrics.jsx";
import WhitepaperModal      from "./components/WhitepaperModal.jsx";

export default function App() {
  const [whitepaperOpen, setWhitepaperOpen] = useState(false);
  const [activePanel, setActivePanel] = useState(null);

  const openPanel = (id) => setActivePanel(id);
  const closePanel = () => setActivePanel(null);

  return (
    <div className="min-h-screen bg-paradox-black font-sans">
      <Navbar
        onOpenWhitepaper={() => setWhitepaperOpen(true)}
        activeTab={activePanel}
        onTabChange={openPanel}
      />

      {/* Hero always rendered as background */}
      <Hero
        onOpenWhitepaper={() => setWhitepaperOpen(true)}
        onOpenPanel={openPanel}
      />

      {/* Panel windows float over hero */}
      <AnimatePresence mode="wait">
        {activePanel === "overview" && (
          <PanelWindow key="overview" id="overview" onClose={closePanel}>
            <LiveStats />
            <BeliefMetrics />
            <SecurityStatus />
            <Manifesto />
          </PanelWindow>
        )}
        {activePanel === "participate" && (
          <PanelWindow key="participate" id="participate" onClose={closePanel}>
            <EpochSection />
            <ParticipantDashboard />
          </PanelWindow>
        )}
        {activePanel === "nfts" && (
          <PanelWindow key="nfts" id="nfts" onClose={closePanel}>
            <BurnNFTs />
            <MyBurnNFTs />
            <NFTPreviews />
          </PanelWindow>
        )}
        {activePanel === "trade" && (
          <PanelWindow key="trade" id="trade" onClose={closePanel}>
            <TradeLinks />
            <Tokenomics />
            <ShareLinks />
          </PanelWindow>
        )}
        {activePanel === "community" && (
          <PanelWindow key="community" id="community" onClose={closePanel}>
            <ChatCTA />
            <Chat />
          </PanelWindow>
        )}
      </AnimatePresence>

      <WhitepaperModal open={whitepaperOpen} onClose={() => setWhitepaperOpen(false)} />
    </div>
  );
}
