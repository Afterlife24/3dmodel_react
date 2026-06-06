export default function Stage() {
  return (
    <div className="stage-container">
      <div className="stage">
        {/* Outer glow base */}
        <div className="stage-glow"></div>

        {/* Platform layers */}
        <div className="platform-layer platform-layer-1"></div>
        <div className="platform-layer platform-layer-2"></div>
        <div className="platform-layer platform-layer-3"></div>
        <div className="platform-layer platform-layer-4"></div>

        {/* Top surface */}
        <div className="platform-top"></div>

        {/* Light particles */}
        <div className="light-particle particle-1"></div>
        <div className="light-particle particle-2"></div>
        <div className="light-particle particle-3"></div>
        <div className="light-particle particle-4"></div>
      </div>
    </div>
  );
}
