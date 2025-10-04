import { useState } from "react";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const signIn = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.hash = "#/app";
    } catch (e) {
      setErr(e.message);
    }
  };

  // Use once to create your own account
  const signUp = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      window.location.hash = "#/app";
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 440, marginTop: 60 }}>
      <div className="card">
        <h2 style={{ marginBottom: 12 }}>Sign in</h2>
        {err && <div className="alert" style={{ color: "crimson", marginBottom: 8 }}>{err}</div>}
        <form onSubmit={signIn}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
          </div>
          <div className="buttons">
            <button className="btn-primary">Sign in</button>
            <button type="button" className="btn-secondary" onClick={signUp}>Sign up</button>
          </div>
        </form>
      </div>
    </div>
  );
}
