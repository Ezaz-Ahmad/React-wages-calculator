import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
// IMPORTANT: make sure this file exists
import "./styles.css";   // ← use your big CSS here (not index.css)

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
