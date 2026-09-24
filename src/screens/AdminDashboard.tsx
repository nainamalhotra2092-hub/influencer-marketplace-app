import { useEffect, useState } from "react";
import type { Portrait, Upload, User } from "../types";
import { fetchAdminTalent, fetchAdminTalentDetail, updateAdminTalent } from "../api/client";
import Icon from "../components/Icon";
import Shell from "../components/Shell";
import TalentProfilePanel from "../components/TalentProfilePanel";

function rupees(value: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

export default function AdminDashboard({ user, onLogout, onHome }: { user: User; onLogout: () => void; onHome: () => void }) {
  const [talent, setTalent] = useState<Portrait[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { verified: boolean; agreedPrice: string }>>({});
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<{ talent: Portrait; uploads: Upload[] } | null>(null);
  const [detailBusy, setDetailBusy] = useState(false);

  const load = () =>
    fetchAdminTalent(user.id).then((data) => {
      setTalent(data.results);
      setDrafts(
        Object.fromEntries(
          data.results.map((item) => [
            item.id,
            {
              verified: Boolean(item.verified),
              agreedPrice: String(item.agreedPrice ?? item.proposedPrice ?? 0),
            },
          ]),
        ),
      );
    });

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Could not load talent"));
  }, [user.id]);

  const updateDraft = (id: string, patch: Partial<{ verified: boolean; agreedPrice: string }>) => {
    setDrafts((current) => ({ ...current, [id]: { ...current[id], ...patch } }));
  };

  const openProfile = async (profile: Portrait) => {
    setError("");
    setDetailBusy(true);
    try {
      setDetail(await fetchAdminTalentDetail(user.id, profile.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load creator profile");
    } finally {
      setDetailBusy(false);
    }
  };

  return (
    <Shell user={user} onLogout={onLogout} onHome={onHome}>
      <main className="mx-auto max-w-[1500px] px-5 py-10 lg:px-10">
        <p className="text-xs font-bold uppercase tracking-[.15em] text-[#68884b]">Admin</p>
        <h1 className="font-display mt-2 text-5xl font-semibold tracking-[-.05em]">Verify talent and set prices.</h1>
        <p className="mt-3 max-w-2xl text-[#6f786c]">Review each creator’s proposed rate, set the agreed license price, then verify them for the marketplace. The buyer processing fee is always 10% of the agreed price. Click a name to open their full profile.</p>
        {error ? <p className="mt-4 text-sm text-[#9a3d2f]">{error}</p> : null}
        <div className="mt-10 grid gap-5">
          {talent.map((profile) => {
            const draft = drafts[profile.id] || { verified: false, agreedPrice: "0" };
            const agreedAmount = Number(draft.agreedPrice) || 0;
            const processingFee = Math.round(agreedAmount * 0.1);
            return (
              <article key={profile.id} className="grid gap-5 rounded-[1.5rem] bg-white p-5 shadow-[0_12px_40px_rgba(28,40,25,.06)] md:grid-cols-[160px_1fr_auto] md:items-center">
                <img src={profile.image} alt="" className="h-40 w-full rounded-2xl object-cover md:h-28 md:w-40" />
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" onClick={() => openProfile(profile)} className="font-display text-2xl font-semibold underline-offset-4 hover:underline">
                      {profile.name}
                    </button>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${draft.verified ? "bg-[#e9f6d7] text-[#4f742f]" : "bg-[#f3ece3] text-[#8a6a3a]"}`}>
                      {draft.verified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#748071]">{profile.type}</p>
                  <p className="mt-3 text-sm">
                    Proposed price <strong>{rupees(profile.proposedPrice || 0)}</strong>
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <label className="text-xs font-bold uppercase tracking-[.08em] text-[#687266]">
                      Agreed price (₹)
                      <input
                        type="number"
                        min="0"
                        value={draft.agreedPrice}
                        onChange={(e) => updateDraft(profile.id, { agreedPrice: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-[#d5d9d0] px-3 py-2.5 text-sm font-semibold normal-case tracking-normal"
                      />
                    </label>
                    <p className="text-xs font-bold uppercase tracking-[.08em] text-[#687266]">
                      Buyer processing fee (10%)
                      <strong className="mt-1 block rounded-xl border border-[#d5d9d0] bg-[#f7f8f4] px-3 py-2.5 text-sm font-semibold normal-case tracking-normal">
                        {rupees(processingFee)}
                      </strong>
                    </p>
                    <label className="flex items-end gap-2 pb-3 text-sm font-semibold">
                      <input
                        type="checkbox"
                        checked={draft.verified}
                        onChange={(e) => updateDraft(profile.id, { verified: e.target.checked })}
                        className="h-4 w-4 accent-[#172016]"
                      />
                      Verify talent
                    </label>
                  </div>
                </div>
                <button
                  disabled={saving === profile.id}
                  onClick={async () => {
                    setError("");
                    setSaving(profile.id);
                    try {
                      const { talent: next } = await updateAdminTalent(user.id, profile.id, {
                        verified: draft.verified,
                        agreedPrice: Number(draft.agreedPrice) || 0,
                      });
                      setTalent((current) => current.map((item) => (item.id === next.id ? next : item)));
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Could not save");
                    } finally {
                      setSaving("");
                    }
                  }}
                  className="h-12 rounded-full bg-[#172016] px-6 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving === profile.id ? "Saving..." : "Save"}
                </button>
              </article>
            );
          })}
        </div>
      </main>
      {detailBusy && !detail ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-[#11180f]/40 text-sm font-semibold text-white">Loading profile...</div>
      ) : null}
      {detail ? <TalentProfilePanel talent={detail.talent} uploads={detail.uploads} onClose={() => setDetail(null)} /> : null}
    </Shell>
  );
}
