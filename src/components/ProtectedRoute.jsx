import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null; // or a spinner
  if (!user) { window.location.hash = "#/login"; return null; }
  return children;
}
