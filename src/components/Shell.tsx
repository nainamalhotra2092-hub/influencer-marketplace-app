import type { ReactNode } from "react";
import type { User } from "../types";
import Icon from "./Icon";
import Logo from "./Logo";

export default function Shell({
  children,
  user,
  onLogout,
  onHome,
  showShortlist = false,
  shortlistOpen = false,
  onShortlist,
}: {
  children: ReactNode;
  user: User;
  onLogout: () => void;
  onHome?: () => void;
  showShortlist?: boolean;
  shortlistOpen?: boolean;
  onShortlist?: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#f4f2eb] text-[#172016]">
      <header className="sticky top-0 z-20 border-b border-[#dfe1da] bg-[#f4f2eb]/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1500px] items-center justify-between px-5 lg:px-10">
          <Logo onClick={onHome} />
          <div className="flex items-center gap-3">
            {showShortlist ? (
              <button
                onClick={onShortlist}
                className={`grid h-10 w-10 place-items-center rounded-full border ${shortlistOpen ? "border-[#172016] bg-[#172016] text-white" : "border-[#d1d5ce]"}`}
                aria-label={shortlistOpen ? "Show all talent" : "View shortlist"}
                aria-pressed={shortlistOpen}
              >
                <Icon name="bookmark" size={18} filled={shortlistOpen} />
              </button>
            ) : null}
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{user.name}</p>
              <p className="text-xs text-[#788176]">{user.role === "admin" ? "Admin" : user.role === "artist" ? user.title || "Creator" : user.company || "Buyer"}</p>
            </div>
            <button onClick={onLogout} title="Sign out" className="grid h-10 w-10 place-items-center rounded-full bg-[#172016] text-white">
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
