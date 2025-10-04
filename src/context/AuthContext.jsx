import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setReady(true);
    });
    return () => unsub();
  }, []);

  const logout = () => signOut(auth);

  return (
    <AuthCtx.Provider value={{ user, ready, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
