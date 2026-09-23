import { useState } from "react";
import type { Role, Screen, User } from "./types";
import ArtistDashboard from "./screens/ArtistDashboard";
import BuyerDashboard from "./screens/BuyerDashboard";
import Intro from "./screens/Intro";
import Register from "./screens/Register";
import Setup from "./screens/Setup";

export default function App() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [role, setRole] = useState<Role>("artist");
  const [user, setUser] = useState<User | null>(null);

  const choose = (nextRole: Role) => {
    setRole(nextRole);
    setScreen("register");
  };

  const logout = () => {
    setUser(null);
    setScreen("intro");
  };

  if (screen === "intro") return <Intro onChoose={choose} />;
  if (screen === "register") {
    return (
      <Register
        role={role}
        onBack={() => setScreen("intro")}
        onContinue={(nextUser) => {
          setUser(nextUser);
          setScreen(nextUser.role === "artist" ? "setup" : "buyer");
        }}
      />
    );
  }
  if (screen === "setup" && user) {
    return (
      <Setup
        user={user}
        onComplete={(nextUser) => {
          setUser(nextUser);
          setScreen("artist");
        }}
      />
    );
  }
  if (screen === "artist" && user) return <ArtistDashboard user={user} onLogout={logout} />;
  if (screen === "buyer" && user) return <BuyerDashboard user={user} onLogout={logout} />;
  return <Intro onChoose={choose} />;
}
