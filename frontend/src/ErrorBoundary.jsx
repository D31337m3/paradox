import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: "#0a0a0f", color: "#a78bfa", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "monospace", padding: "2rem", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔮</div>
          <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>PARADOX</h1>
          <p style={{ color: "#94a3b8", marginBottom: "1rem" }}>App encountered an error</p>
          <pre style={{ color: "#f87171", fontSize: "0.75rem", maxWidth: "600px", overflow: "auto", background: "#1e1b2e", padding: "1rem", borderRadius: "8px" }}>
            {this.state.error?.message}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: "1.5rem", padding: "0.5rem 1.5rem", background: "#7c3aed", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
