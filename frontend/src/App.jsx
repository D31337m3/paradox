import { useState } from "react";
import Navbar       from "./components/Navbar.jsx";
import Hero         from "./components/Hero.jsx";
import LiveStats     from "./components/LiveStats.jsx";
import EpochSection  from "./components/EpochSection.jsx";
import ParticipantDashboard from "./components/ParticipantDashboard.jsx";
import Manifesto     from "./components/Manifesto.jsx";
import Tokenomics    from "./components/Tokenomics.jsx";
import BurnNFTs      from "./components/BurnNFTs.jsx";
import NFTPreviews   from "./components/NFTPreviews.jsx";
import MyBurnNFTs    from "./components/MyBurnNFTs.jsx";
import TradeLinks    from "./components/TradeLinks.jsx";
import ShareLinks    from "./components/ShareLinks.jsx";
import ChatCTA        from "./components/ChatCTA.jsx";
import Chat          from "./components/Chat.jsx";
import Footer        from "./components/Footer.jsx";
import WhitepaperModal from "./components/WhitepaperModal.jsx";

export default function App() {
  const [whitepaperOpen, setWhitepaperOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paradox-black font-sans">
      <Navbar onOpenWhitepaper={() => setWhitepaperOpen(true)} />
      <main>
        <Hero onOpenWhitepaper={() => setWhitepaperOpen(true)} />
        <LiveStats />
        <Manifesto />
        <EpochSection />
        <ParticipantDashboard />
        <Tokenomics />
        <BurnNFTs />
        <MyBurnNFTs />
        <NFTPreviews />
        <TradeLinks />
        <ShareLinks />
        <ChatCTA />
        <Chat />
      </main>
      <Footer />
      <WhitepaperModal open={whitepaperOpen} onClose={() => setWhitepaperOpen(false)} />
    </div>
  );
}
