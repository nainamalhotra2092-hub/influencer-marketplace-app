import { useEffect, useState } from "react";
import type { Role, Screen, User } from "./types";
import { fetchUser } from "./api/client";
import ArtistDashboard from "./screens/ArtistDashboard";
import BuyerDashboard from "./screens/BuyerDashboard";
import Intro from "./screens/Intro";
import Register from "./screens/Register";
import Setup from "./screens/Setup";

const SESSION_KEY = "facerights-session";

type Session = { screen: Screen; role: Role; user: User | null };

function readSession(): Session {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return { screen: "intro", role: "artist", user: null };
    return JSON.parse(raw) as Session;
  } catch {
    return { screen: "intro", role: "artist", user: null };
  }
}

export default function App() {
  const saved = readSession();
  const [screen, setScreen] = useState<Screen>(saved.screen);
  const [role, setRole] = useState<Role>(saved.role);
  const [user, setUser] = useState<User | null>(saved.user);

  useEffect(() => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ screen, role, user }));
  }, [screen, role, user]);

  useEffect(() => {
    if (!saved.user?.id) return;
    fetchUser(saved.user.id)
      .then(({ user: next }) => {
        setUser(next);
        if (saved.screen === "intro") {
          setScreen(next.role === "artist" && !next.talentId ? "setup" : next.role === "artist" ? "artist" : "buyer");
        }
      })
      .catch(() => {
        localStorage.removeItem(SESSION_KEY);
        setUser(null);
        setScreen("intro");
      });
  }, []);

  const choose = (nextRole: Role) => {
    setRole(nextRole);
    setScreen("register");
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
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
