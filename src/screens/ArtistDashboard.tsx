import { useEffect, useState } from "react";
import type { Upload, User } from "../types";
import { addStudioMedia, deleteStudioMedia, fetchStudio } from "../api/client";
import Icon from "../components/Icon";
import Shell from "../components/Shell";
import StatCard from "../components/StatCard";

function formatRupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function ArtistDashboard({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [completion, setCompletion] = useState(40);
  const [stats, setStats] = useState({ views: 0, shortlists: 0, licenses: 0, earnings: 0 });
  const firstName = user.name.split(" ")[0] || "there";

  useEffect(() => {
    fetchStudio(user.id)
      .then((data) => {
        setUploads(data.uploads);
        setCompletion(data.completion);
        setStats(data.stats);
      })
      .catch(() => undefined);
  }, [user.id]);

  const addUpload = async () => {
    const { media } = await addStudioMedia(user.id);
    setUploads((current) => [...current, media]);
  };

  return (
    <Shell user={user} onLogout={onLogout}>
      <main className="mx-auto max-w-[1500px] px-5 py-10 lg:px-10">
        <section className="grid gap-5 lg:grid-cols-[1.5fr_.5fr]">
          <div className="rounded-[2rem] bg-[#172016] p-8 text-white md:p-10">
            <p className="text-xs font-bold uppercase tracking-[.15em] text-[#c9ff44]">Creator studio</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h1 className="font-display text-5xl font-semibold tracking-[-.05em]">Good morning, {firstName}.</h1>
                <p className="mt-3 text-white/60">Your profile is {completion}% complete. Add more expressions to get discovered.</p>
              </div>
              <button onClick={addUpload} className="flex items-center gap-2 rounded-full bg-[#c9ff44] px-5 py-3 text-sm font-bold text-[#172016]">
                <Icon name="upload" size={18} /> Upload media
              </button>
            </div>
          </div>
          <div className="rounded-[2rem] bg-[#dce9cc] p-8">
            <p className="text-xs font-bold uppercase tracking-[.12em] text-[#5d7250]">Profile health</p>
            <p className="font-display mt-4 text-5xl font-semibold">{completion}%</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/60">
              <div className="h-full bg-[#5e7f45]" style={{ width: `${completion}%` }} />
            </div>
            <p className="mt-4 text-xs text-[#5e6d54]">Verified and visible to buyers</p>
          </div>
        </section>
        <section className="mt-12">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.13em] text-[#6c7867]">Likeness library</p>
              <h2 className="font-display mt-2 text-4xl font-semibold tracking-tight">Your uploaded media</h2>
            </div>
            <p className="hidden text-sm text-[#737d70] sm:block">{uploads.length} of 12 assets</p>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {uploads.map((upload) => (
              <article key={upload.id} className="group relative aspect-[4/5] overflow-hidden rounded-3xl bg-[#d9ddd4]">
                <img src={upload.image} alt={upload.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 text-white">
                  <p className="font-semibold">{upload.title}</p>
                  <p className="text-xs text-white/60">Approved · High resolution</p>
                </div>
                <button
                  onClick={async () => {
                    await deleteStudioMedia(user.id, upload.id);
                    setUploads((current) => current.filter((item) => item.id !== upload.id));
                  }}
                  className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#172016] opacity-0 transition group-hover:opacity-100"
                  aria-label={`Delete ${upload.title}`}
                >
                  <Icon name="trash" size={16} />
                </button>
              </article>
            ))}
            <button
              onClick={addUpload}
              className="grid aspect-[4/5] place-items-center rounded-3xl border-2 border-dashed border-[#bdc6b8] text-center text-[#687365] hover:bg-white"
            >
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e0e7d9]">
                  <Icon name="plus" />
                </span>
                <p className="mt-3 font-semibold">Add another</p>
                <p className="mt-1 text-xs">Profile, expression or tone</p>
              </div>
            </button>
          </div>
        </section>
        <section className="mt-12 grid gap-5 md:grid-cols-3">
          <StatCard label="Profile views" value={stats.views.toLocaleString("en-IN")} change="+18% this month" />
          <StatCard label="Buyer shortlists" value={String(stats.shortlists)} change="+7 this week" />
          <StatCard label="License earnings" value={formatRupees(stats.earnings)} change={`${stats.licenses} active licenses`} />
        </section>
      </main>
    </Shell>
  );
}
