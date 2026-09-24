import { useEffect, useState } from "react";
import type { Role, Screen, User } from "./types";
import { fetchUser } from "./api/client";
import ArtistDashboard from "./screens/ArtistDashboard";
import BuyerDashboard from "./screens/BuyerDashboard";
import Intro from "./screens/Intro";
import Login from "./screens/Login";
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

  const enterAs = (nextUser: User) => {
    setUser(nextUser);
    setRole(nextUser.role);
    setScreen(nextUser.role === "artist" && !nextUser.talentId ? "setup" : nextUser.role === "artist" ? "artist" : "buyer");
  };

  if (screen === "intro") return <Intro onChoose={choose} onLogin={() => setScreen("login")} />;
  if (screen === "login") {
    return <Login onBack={() => setScreen("intro")} onSuccess={enterAs} />;
  }
  if (screen === "register") {
    return (
      <Register
        role={role}
        onBack={() => setScreen("intro")}
        onContinue={enterAs}
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
  return <Intro onChoose={choose} onLogin={() => setScreen("login")} />;
}
