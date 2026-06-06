export default function StatusOverlay({
  status,
  agentText,
  userText,
  errorMsg,
}) {
  const statusConfig = {
    connecting: { label: "Connecting", color: "#ffb700" },
    connected: { label: "Initializing", color: "#ffb700" },
    listening: { label: "Listening", color: "#00d4ff" },
    speaking: { label: "Speaking", color: "#00ffc8" },
    disconnected: { label: "Offline", color: "#2a4050" },
    error: { label: "Error", color: "#ff5050" },
  };

  const config = statusConfig[status] || { label: "", color: "transparent" };

  return (
    <div
      className="absolute z-30 flex flex-col items-center gap-3"
      style={{
        bottom: "4rem",
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "460px",
        pointerEvents: "none",
      }}
    >
      {status === "error" && (
        <div className="transcript-bubble error">
          <span
            style={{
              fontSize: 9,
              letterSpacing: 2,
              opacity: 0.6,
              display: "block",
              marginBottom: 6,
              textTransform: "uppercase",
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            Connection Error
          </span>
          Network error. Please check your connection and try again.
        </div>
      )}

      {userText && (
        <div className="transcript-bubble">
          <span
            style={{
              fontSize: 9,
              letterSpacing: 2,
              opacity: 0.5,
              marginRight: 8,
              textTransform: "uppercase",
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            You
          </span>
          <span style={{ fontStyle: "italic" }}>{userText}</span>
        </div>
      )}

      {agentText && (
        <div className="transcript-bubble agent">
          <span
            style={{
              fontSize: 9,
              letterSpacing: 2,
              opacity: 0.6,
              marginRight: 8,
              textTransform: "uppercase",
              fontFamily: "'Orbitron', sans-serif",
            }}
          >
            Assistant
          </span>
          <span style={{ fontStyle: "italic" }}>{agentText}</span>
        </div>
      )}

      {config.label && (
        <div className="status-pill">
          <span
            className="status-dot"
            style={{ background: config.color, color: config.color }}
          />
          {config.label}
        </div>
      )}
    </div>
  );
}
