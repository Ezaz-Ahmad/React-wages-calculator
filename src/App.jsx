import { useEffect, useState } from "react";
import AuthProvider from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LandingPage from "./components/LandingPage.jsx";
import Calculator from "./components/Calculator.jsx";
import Login from "./components/Login.jsx";
import LogoutButton from "./components/LogoutButton.jsx";

export default function App() {
  const [route, setRoute] = useState(window.location.hash || "#/");

  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  return (
    <AuthProvider>
      {route === "#/" && (
        <LandingPage onStart={() => (window.location.hash = "#/login")} />
      )}

      {route === "#/login" && <Login />}

      {route === "#/app" && (
        <ProtectedRoute>
          {/* optional small header with logout */}
          <div style={{ display: "flex", justifyContent: "flex-end", padding: "12px 20px" }}>
            <LogoutButton />
          </div>
          <Calculator />
        </ProtectedRoute>
      )}
    </AuthProvider>
  );
}
