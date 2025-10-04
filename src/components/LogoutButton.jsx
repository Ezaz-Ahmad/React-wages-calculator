import { useAuth } from "../context/AuthContext";

export default function LogoutButton() {
  const { logout } = useAuth();
  return (
    <button type="button" className="btn-secondary" onClick={async ()=> {
      await logout();
      window.location.hash = "#/login";
    }}>
      Logout
    </button>
  );
}
