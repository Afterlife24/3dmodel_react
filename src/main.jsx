import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";

class ErrorBoundary extends React.Component {
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
        <div className="w-screen h-screen bg-[#050508] flex flex-col items-center justify-center text-center p-8">
          <div className="text-red-400/80 text-sm font-light tracking-wider uppercase mb-4">
            System Error
          </div>
          <pre className="text-red-300/60 text-xs max-w-lg whitespace-pre-wrap font-mono">
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <GoogleOAuthProvider
          clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ""}
        >
          <AuthProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
);
