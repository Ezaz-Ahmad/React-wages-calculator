import React from "react";

export default function LandingPage({ onStart }) {
  return (
    <div id="landing-page" className="screen active">
      <div className="landing-content">
        <h1 className="landing-title">EzyMart Wages Calculator</h1>
        <p className="landing-subtitle">Simplify Your Wage Calculations with Ease</p>
        <button className="landing-btn" onClick={onStart}>Get Started</button>
      </div>
      <div className="landing-wave"></div>
    </div>
  );
}
