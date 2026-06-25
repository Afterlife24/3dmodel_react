/**
 * AgentButtons — the PNG IS the full 3D button artwork.
 * Panels open on CLICK only (no hover-to-open) for consistency
 * across all devices and to avoid accidental triggers.
 */

import { useState, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import WhatsAppPanel from "./WhatsAppPanel";
import CallingPanel from "./CallingPanel";

// Log agent usage to backend
async function logAgentUsage(userEmail, userName, agentType) {
  try {
    const AUTH_API = import.meta.env.VITE_AUTH_API || "http://localhost:5000/api/auth";
    const API_URL = AUTH_API.replace(/\/auth$/, "");
    
    await fetch(`${API_URL}/agent-usage/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userEmail, userName, agentType }),
    });
  } catch (err) {
    console.warn("Failed to log agent usage:", err);
  }
}

function OrbButton({ onClick, variant, ariaLabel, iconSrc, iconAlt, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`orb-btn orb-btn--${variant}`}
      aria-label={ariaLabel}
    >
      {/* ambient space-glow halo behind the PNG */}
      <span className="orb-halo" aria-hidden="true" />

      {/* the full 3D button PNG */}
      <img src={iconSrc} alt={iconAlt} className="orb-png" draggable="false" />

      {/* ground reflection streak */}
      <span className="orb-ground" aria-hidden="true" />

      {/* text label */}
      <span className="orb-label">{label}</span>
    </button>
  );
}

export default function AgentButtons({ whatsappUrl, callUrl }) {
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const [callingOpen, setCallingOpen] = useState(false);
  const [showAuthMessage, setShowAuthMessage] = useState(false);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const isAuthed = !isLoading && !!user;

  const toggleWhatsapp = useCallback(() => {
    if (!isAuthed) {
      setShowAuthMessage(true);
      setTimeout(() => setShowAuthMessage(false), 3000);
      return;
    }
    
    // Log usage when opening WhatsApp panel
    if (!whatsappOpen) {
      logAgentUsage(user.email, user.name, "whatsapp");
    }
    
    setWhatsappOpen((prev) => !prev);
    setCallingOpen(false);
  }, [isAuthed, user, whatsappOpen]);

  const toggleCalling = useCallback(() => {
    if (!isAuthed) {
      setShowAuthMessage(true);
      setTimeout(() => setShowAuthMessage(false), 3000);
      return;
    }
    
    // Log usage when opening Calling panel
    if (!callingOpen) {
      logAgentUsage(user.email, user.name, "calling");
    }
    
    setCallingOpen((prev) => !prev);
    setWhatsappOpen(false);
  }, [isAuthed, user, callingOpen]);

  const closeWhatsapp = useCallback(() => {
    setWhatsappOpen(false);
  }, []);

  const closeCalling = useCallback(() => {
    setCallingOpen(false);
  }, []);

  // Extract the WhatsApp number from the URL for the panel
  const whatsappNumber = whatsappUrl
    ? whatsappUrl.replace(/.*wa\.me\//, "").replace(/[^0-9+]/g, "")
    : "";

  // Extract inbound call number
  const inboundNumber = callUrl ? callUrl.replace(/^tel:/, "") : "+1234567890";

  return (
    <div className="agent-btns-wrap" aria-label="Contact agent buttons">
      {/* Sign in first message */}
      {showAuthMessage && (
        <div className="auth-message-overlay">
          <div className="auth-message-box">
            <p>Please sign in first</p>
            <div className="auth-message-buttons">
              <button
                onClick={() => navigate("/login")}
                className="auth-message-btn auth-message-btn-login"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate("/signup")}
                className="auth-message-btn auth-message-btn-signup"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      <OrbButton
        onClick={toggleWhatsapp}
        variant="whatsapp"
        ariaLabel="Chat on WhatsApp"
        iconSrc="/assets/whatsapp.png"
        iconAlt="WhatsApp Agent"
        label="Chat on WhatsApp"
      />

      <WhatsAppPanel
        isOpen={whatsappOpen}
        onClose={closeWhatsapp}
        whatsappNumber={whatsappNumber}
      />

      <OrbButton
        onClick={toggleCalling}
        variant="calling"
        ariaLabel="Call Us"
        iconSrc="/assets/calling.png"
        iconAlt="Calling Agent"
        label="Call Us"
      />

      <CallingPanel
        isOpen={callingOpen}
        onClose={closeCalling}
        inboundNumber={inboundNumber}
      />
    </div>
  );
}

