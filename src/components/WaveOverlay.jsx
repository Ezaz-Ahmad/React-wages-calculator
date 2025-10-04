import React from "react";

export default function WaveOverlay({ show }) {
  return (
    <div id="wave-overlay" className="wave-overlay" style={{ display: show ? "flex" : "none" }}>
      <div className="wave-message">Processing your request</div>
      <div className="wave"></div>
      <div className="wave"></div>
      <div className="wave"></div>
    </div>
  );
}
