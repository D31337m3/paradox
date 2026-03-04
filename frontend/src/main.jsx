import React from "react";
import ReactDOM from "react-dom/client";
import { createWeb3Modal } from "@web3modal/wagmi";
import { WagmiProvider, createConfig, http, fallback } from "wagmi";
import { polygon } from "wagmi/chains";
import { walletConnect, injected, coinbaseWallet } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.jsx";
import { ErrorBoundary } from "./ErrorBoundary.jsx";
import "./index.css";

// Prevent browser from restoring scroll position mid-page on reload
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

// WalletConnect project ID (public)
const projectId = "b56e18d47c72ab683b10814fe9495694";

const metadata = {
  name: "PARADOX",
  description: "A Behavioral Liquidity Experiment on Polygon",
  url: "https://paradox.d31337m3.com",
  icons: ["https://paradox.d31337m3.com/pdx-token-icon.png"],
};

const config = createConfig({
  chains: [polygon],
  transports: {
    [polygon.id]: fallback([
      http(import.meta.env.VITE_POLYGON_RPC_URL || "https://polygon-rpc.com"),
      http("https://rpc.ankr.com/polygon"),
    ]),
  },
  connectors: [
    walletConnect({ projectId, metadata }),
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: "PARADOX", appLogoUrl: metadata.icons[0] }),
  ],
});

createWeb3Modal({
  wagmiConfig: config,
  projectId,
  defaultChain: polygon,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#7c3aed",
    "--w3m-border-radius-master": "12px",
  },
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 2, staleTime: 0, refetchOnWindowFocus: false } },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
