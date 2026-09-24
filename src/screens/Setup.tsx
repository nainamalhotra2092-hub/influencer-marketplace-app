import { useState } from "react";
import type { User } from "../types";
import { completeProfile } from "../api/client";
import Field from "../components/Field";
import Icon from "../components/Icon";
import Logo from "../components/Logo";

export default function Setup({ user, onBack, onComplete }: { user: User; onBack: () => void; onComplete: (user: User) => void }) {
  const [error, setError] = useState("");

  return (
    <main className="min-h-screen bg-[#f4f1e9] p-6 text-[#172016] md:p-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Logo onClick={onBack} />
          <span className="text-xs font-bold uppercase tracking-[.14em] text-[#778074]">Step 2 of 2</span>
        </div>
        <div className="mt-16 grid gap-12 lg:grid-cols-[.75fr_1.25fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#648446]">Set up profile</p>
            <h1 className="font-display mt-3 text-6xl font-semibold leading-[.95] tracking-[-.055em]">Help buyers find the real you.</h1>
            <p className="mt-6 leading-7 text-[#667063]">These details help match your likeness to the right, respectful opportunities.</p>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              setError("");
              try {
                const { user: next } = await completeProfile(user.id, {
                  dob: form.get("dob"),
                  ethnicity: form.get("ethnicity"),
                  city: form.get("city"),
                  title: form.get("title"),
                  bio: form.get("bio"),
                });
                onComplete(next);
              } catch (err) {
                setError(err instanceof Error ? err.message : "Could not save profile");
              }
            }}
            className="grid gap-5 rounded-[2rem] bg-white p-7 shadow-[0_20px_70px_rgba(35,45,30,.08)] sm:grid-cols-2 md:p-10"
          >
            <Field name="dob" label="Date of birth" placeholder="" type="date" defaultValue={user.dob || ""} />
            <label>
              <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#687266]">Ethnicity</span>
              <select name="ethnicity" required defaultValue={user.ethnicity || ""} className="w-full rounded-xl border border-[#d5d9d0] bg-white px-4 py-3.5 text-sm outline-none">
                <option value="">Select ethnicity</option>
                <option>South Asian</option>
                <option>East Asian</option>
                <option>Black / African</option>
                <option>White / European</option>
                <option>Mixed</option>
              </select>
            </label>
            <Field name="city" label="City" placeholder="Mumbai" defaultValue={user.city || ""} />
            <Field name="title" label="Professional title" placeholder="Actor, artist, creator..." defaultValue={user.title || ""} />
            <label className="sm:col-span-2">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#687266]">Short bio</span>
              <textarea
                name="bio"
                rows={4}
                defaultValue={user.bio || ""}
                placeholder="Tell buyers about your work and interests..."
                className="w-full resize-none rounded-xl border border-[#d5d9d0] px-4 py-3.5 text-sm outline-none"
              />
            </label>
            {error ? <p className="sm:col-span-2 text-sm text-[#9a3d2f]">{error}</p> : null}
            <button className="sm:col-span-2 mt-2 flex items-center justify-center gap-3 rounded-full bg-[#172016] px-7 py-4 font-semibold text-white">
              Complete profile <Icon name="arrow" size={18} />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
