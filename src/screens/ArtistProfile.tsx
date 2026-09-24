import { useEffect, useState } from "react";
import type { User } from "../types";
import { completeProfile, fetchStudio } from "../api/client";
import Field from "../components/Field";
import Icon from "../components/Icon";
import Shell from "../components/Shell";

export default function ArtistProfile({
  user,
  onLogout,
  onHome,
  onBack,
  onUserChange,
}: {
  user: User;
  onLogout: () => void;
  onHome: () => void;
  onBack: () => void;
  onUserChange: (user: User) => void;
}) {
  const [profile, setProfile] = useState(user);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchStudio(user.id)
      .then((data) => {
        setProfile(data.user);
        onUserChange(data.user);
      })
      .catch(() => undefined);
  }, [user.id]);

  return (
    <Shell user={profile} onLogout={onLogout} onHome={onHome}>
      <main className="mx-auto max-w-[1500px] px-5 py-10 lg:px-10">
        <button onClick={onBack} className="mb-8 flex items-center gap-2 text-sm text-[#687066]">
          <span className="rotate-180">
            <Icon name="arrow" size={17} />
          </span>
          Back to studio
        </button>
        <p className="text-xs font-bold uppercase tracking-[.13em] text-[#6c7867]">Public profile</p>
        <h1 className="font-display mt-2 text-5xl font-semibold tracking-tight">Edit your details</h1>
        <p className="mt-3 max-w-xl text-[#6f796d]">These details are visible to buyers on your marketplace card.</p>
        <form
          key={`${profile.dob || ""}-${profile.instagram || ""}-${profile.followers || ""}`}
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            setError("");
            setSaved("");
            setBusy(true);
            try {
              const { user: next } = await completeProfile(user.id, {
                dob: form.get("dob"),
                ethnicity: form.get("ethnicity"),
                city: form.get("city"),
                title: form.get("title"),
                bio: form.get("bio"),
                instagram: form.get("instagram"),
                followers: form.get("followers"),
              });
              setProfile(next);
              onUserChange(next);
              setSaved("Profile updated");
            } catch (err) {
              setError(err instanceof Error ? err.message : "Could not save profile");
            } finally {
              setBusy(false);
            }
          }}
          className="mt-8 grid gap-5 rounded-[2rem] bg-white p-7 shadow-[0_12px_40px_rgba(28,40,25,.06)] sm:grid-cols-2 md:p-8"
        >
          <Field name="dob" label="Date of birth" placeholder="" type="date" defaultValue={profile.dob || ""} />
          <label>
            <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#687266]">Ethnicity</span>
            <select name="ethnicity" required defaultValue={profile.ethnicity || ""} className="w-full rounded-xl border border-[#d5d9d0] bg-white px-4 py-3.5 text-sm outline-none">
              <option value="">Select ethnicity</option>
              <option>South Asian</option>
              <option>East Asian</option>
              <option>Black / African</option>
              <option>White / European</option>
              <option>Mixed</option>
            </select>
          </label>
          <Field name="city" label="City" placeholder="Mumbai" defaultValue={profile.city || ""} />
          <Field name="title" label="Professional title" placeholder="Actor, artist, creator..." defaultValue={profile.title || ""} />
          <Field name="instagram" label="Instagram link" placeholder="https://instagram.com/yourhandle" required={false} defaultValue={profile.instagram || ""} />
          <Field name="followers" label="Followers" placeholder="120K" required={false} defaultValue={profile.followers || ""} />
          <label className="sm:col-span-2">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#687266]">Short bio</span>
            <textarea
              name="bio"
              rows={4}
              defaultValue={profile.bio || ""}
              placeholder="Tell buyers about your work and interests..."
              className="w-full resize-none rounded-xl border border-[#d5d9d0] px-4 py-3.5 text-sm outline-none"
            />
          </label>
          {error ? <p className="sm:col-span-2 text-sm text-[#9a3d2f]">{error}</p> : null}
          {saved ? <p className="sm:col-span-2 text-sm text-[#4f742f]">{saved}</p> : null}
          <button disabled={busy} className="sm:col-span-2 mt-1 flex items-center justify-center gap-3 rounded-full bg-[#172016] px-7 py-4 font-semibold text-white disabled:opacity-60">
            {busy ? "Saving..." : "Save changes"}
          </button>
        </form>
      </main>
    </Shell>
  );
}
