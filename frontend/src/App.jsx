import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar               from "./components/Navbar.jsx";
import TabBar               from "./components/TabBar.jsx";
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
import Footer               from "./components/Footer.jsx";
import WhitepaperModal      from "./components/WhitepaperModal.jsx";

const fadeIn = {
  initial:   { opacity: 0, y: 12 },
  animate:   { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit:      { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

function TabPanel({ id, children }) {
  return (
    <motion.div key={id} {...fadeIn} className="min-h-[calc(100vh-130px)]">
      {children}
    </motion.div>
  );
}

export default function App() {
  const [whitepaperOpen, setWhitepaperOpen] = useState(false);
  const [tab, setTab] = useState("overview");

  return (
    <div className="min-h-screen bg-paradox-black font-sans">
      <Navbar onOpenWhitepaper={() => setWhitepaperOpen(true)} activeTab={tab} onTabChange={setTab} />
      <TabBar active={tab} onChange={setTab} />

      <main>
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <TabPanel key="overview" id="overview">
              <Hero onOpenWhitepaper={() => setWhitepaperOpen(true)} />
              <LiveStats />
              <Manifesto />
            </TabPanel>
          )}
          {tab === "participate" && (
            <TabPanel key="participate" id="participate">
              <EpochSection />
              <ParticipantDashboard />
            </TabPanel>
          )}
          {tab === "nfts" && (
            <TabPanel key="nfts" id="nfts">
              <BurnNFTs />
              <MyBurnNFTs />
              <NFTPreviews />
            </TabPanel>
          )}
          {tab === "trade" && (
            <TabPanel key="trade" id="trade">
              <TradeLinks />
              <Tokenomics />
              <ShareLinks />
            </TabPanel>
          )}
          {tab === "community" && (
            <TabPanel key="community" id="community">
              <ChatCTA />
              <Chat />
            </TabPanel>
          )}
        </AnimatePresence>
      </main>

      <Footer />
      <WhitepaperModal open={whitepaperOpen} onClose={() => setWhitepaperOpen(false)} />
    </div>
  );
}
