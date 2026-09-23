import { useEffect, useState } from "react";
import type { Portrait, User } from "../types";
import { fetchTalent } from "../api/client";
import FilterGroup from "../components/FilterGroup";
import Icon from "../components/Icon";
import PurchaseModal from "../components/PurchaseModal";
import Shell from "../components/Shell";

export default function BuyerDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState("All");
  const [categories, setCategories] = useState<string[]>([]);
  const [ages, setAges] = useState<string[]>([]);
  const [results, setResults] = useState<Portrait[]>([]);
  const [selected, setSelected] = useState<Portrait | null>(null);

  const toggle = (list: string[], value: string) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fetchTalent({ query, gender, categories, ages })
        .then((data) => setResults(data.results))
        .catch(() => setResults([]));
    }, 150);
    return () => window.clearTimeout(timer);
  }, [query, gender, categories, ages]);

  return (
    <Shell user={user} onLogout={onLogout}>
      <main className="mx-auto max-w-[1500px] px-5 py-8 lg:px-10">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[.15em] text-[#68884b]">Talent marketplace</p>
          <h1 className="font-display mt-2 text-5xl font-semibold tracking-[-.05em]">Find a face for your idea.</h1>
        </div>
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <aside className="h-fit rounded-2xl border border-[#dce0d8] bg-white p-5 lg:sticky lg:top-28">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>
              <button
                onClick={() => {
                  setGender("All");
                  setCategories([]);
                  setAges([]);
                }}
                className="text-xs font-semibold text-[#69874f]"
              >
                Reset
              </button>
            </div>
            <FilterGroup
              title="Talent category"
              options={["Actor", "Artist", "Creator", "Model"]}
              selected={categories}
              onToggle={(option) => setCategories((current) => toggle(current, option))}
            />
            <div className="mt-6 border-t border-[#e7e9e3] pt-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-[.09em] text-[#758071]">Profile</p>
              {["All", "Male", "Female", "Male child", "Female child"].map((item) => (
                <label key={item} className="flex cursor-pointer items-center gap-3 py-2 text-sm">
                  <input type="radio" name="gender" checked={gender === item} onChange={() => setGender(item)} className="accent-[#172016]" />
                  {item}
                </label>
              ))}
            </div>
            <FilterGroup title="Age range" options={["18–25", "26–35", "36–50", "50+"]} selected={ages} onToggle={(option) => setAges((current) => toggle(current, option))} />
          </aside>
          <section>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex max-w-xl flex-1 items-center gap-3 rounded-full border border-[#d5dad1] bg-white px-5 py-3.5">
                <Icon name="search" size={19} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name, skill or style"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <p className="text-sm text-[#707a6d]">
                <strong className="text-[#172016]">{results.length}</strong> profiles found
              </p>
            </div>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((profile) => (
                <article key={profile.id} className="group overflow-hidden rounded-[1.5rem] bg-white shadow-[0_12px_40px_rgba(28,40,25,.06)]">
                  <div className="relative aspect-[4/4.6] overflow-hidden">
                    <img src={profile.image} alt={`Portrait of ${profile.name}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                    <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.1em] backdrop-blur">Verified</div>
                    <button
                      onClick={() => setSelected(profile)}
                      aria-label={`License ${profile.name}`}
                      className="absolute bottom-4 right-4 grid h-12 w-12 place-items-center rounded-full bg-[#c9ff44] text-[#172016] shadow-lg transition hover:rotate-90"
                    >
                      <Icon name="plus" />
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-display text-2xl font-semibold tracking-tight">{profile.name}</h3>
                        <p className="text-sm text-[#748071]">{profile.type}</p>
                      </div>
                      <p className="text-sm font-bold">
                        {profile.price}
                        <span className="block text-right text-[10px] font-normal text-[#859080]">from</span>
                      </p>
                    </div>
                    <div className="mt-5 flex gap-5 border-t border-[#eceee9] pt-4 text-xs text-[#6f796d]">
                      <span className="flex items-center gap-1.5">
                        <Icon name="instagram" size={15} />
                        <strong className="text-[#172016]">{profile.followers}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Icon name="briefcase" size={15} />
                        <strong className="text-[#172016]">{profile.collaborations}</strong> collabs
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
      {selected && <PurchaseModal profile={selected} buyerId={user.id} onClose={() => setSelected(null)} />}
    </Shell>
  );
}
