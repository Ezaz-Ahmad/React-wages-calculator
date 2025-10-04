import React, { useEffect, useState } from "react";
import LandingPage from "./components/LandingPage.jsx";
import Calculator from "./components/Calculator.jsx";

export default function App() {
  const [screen, setScreen] = useState("landing");

  useEffect(() => {
    // match original behavior: landing = no scroll, calculator = scroll
    document.body.style.overflow = screen === "calculator" ? "auto" : "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, [screen]);

  return screen === "landing"
    ? <LandingPage onStart={() => setScreen("calculator")} />
    : <Calculator />;
}
