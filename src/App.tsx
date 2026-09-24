import { useEffect, useState } from "react";
import type { Role, Screen, User } from "./types";
import { fetchUser } from "./api/client";
import AdminDashboard from "./screens/AdminDashboard";
import ArtistDashboard from "./screens/ArtistDashboard";
import ArtistProfile from "./screens/ArtistProfile";
import BuyerDashboard from "./screens/BuyerDashboard";
import Intro from "./screens/Intro";
import Login from "./screens/Login";
import Register from "./screens/Register";
import Setup from "./screens/Setup";

const SESSION_KEY = "facetroop-session";

function destinationFor(user: User): Screen {
  if (user.role === "admin") return "admin";
  if (user.role === "artist") return user.talentId ? "artist" : "setup";
  return "buyer";
}

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
  const [screen, setScreen] = useState<Screen>("intro");
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
        setRole(next.role);
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

  const goHome = () => setScreen("intro");

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
    setScreen("intro");
  };

  const enterAs = (nextUser: User) => {
    setUser(nextUser);
    setRole(nextUser.role);
    setScreen(destinationFor(nextUser));
  };

  if (screen === "intro") {
    return (
      <Intro
        onChoose={choose}
        onLogin={() => setScreen("login")}
      />
    );
  }
  if (screen === "login") {
    return <Login onBack={goHome} onSuccess={enterAs} />;
  }
  if (screen === "register") {
    return (
      <Register
        role={role === "admin" ? "buyer" : role}
        onBack={goHome}
        onContinue={enterAs}
      />
    );
  }
  if (screen === "setup" && user) {
    return (
      <Setup
        user={user}
        onBack={goHome}
        onComplete={(nextUser) => {
          setUser(nextUser);
          setScreen("artist");
        }}
      />
    );
  }
  if (screen === "artist" && user) {
    return (
      <ArtistDashboard
        user={user}
        onLogout={logout}
        onHome={goHome}
        onEditProfile={() => setScreen("profile")}
        onUserChange={setUser}
      />
    );
  }
  if (screen === "profile" && user) {
    return (
      <ArtistProfile
        user={user}
        onLogout={logout}
        onHome={goHome}
        onBack={() => setScreen("artist")}
        onUserChange={setUser}
      />
    );
  }
  if (screen === "buyer" && user) return <BuyerDashboard user={user} onLogout={logout} onHome={goHome} />;
  if (screen === "admin" && user) return <AdminDashboard user={user} onLogout={logout} onHome={goHome} />;
  return <Intro onChoose={choose} onLogin={() => setScreen("login")} />;
}
