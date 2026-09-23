import { useState } from "react";
import type { Portrait } from "../types";
import { createLicense } from "../api/client";
import Icon from "./Icon";

function parseRupees(value: string) {
  return Number(value.replace(/[₹,]/g, ""));
}

function formatRupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export default function PurchaseModal({
  profile,
  buyerId,
  onClose,
}: {
  profile: Portrait;
  buyerId?: string;
  onClose: () => void;
}) {
  const [purchased, setPurchased] = useState(false);
  const [duration, setDuration] = useState("12 months");
  const [usage, setUsage] = useState("Film & streaming");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const license = parseRupees(profile.price);
  const protection = 4200;
  const total = license + protection;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#11180f]/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="max-h-[94vh] w-full max-w-2xl overflow-auto rounded-[2rem] bg-[#f8f6ef] p-6 text-[#172016] shadow-2xl md:p-8"
      >
        {purchased ? (
          <div className="grid min-h-[460px] place-items-center text-center">
            <div>
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#c9ff44]">
                <Icon name="check" size={36} />
              </span>
              <h2 className="font-display mt-6 text-4xl font-semibold">Request submitted</h2>
              <p className="mx-auto mt-3 max-w-md text-[#6f786c]">
                Your licensing request was sent to {profile.name}. Payment will be collected after they approve the usage.
              </p>
              <button onClick={onClose} className="mt-7 rounded-full bg-[#172016] px-7 py-3 text-sm font-semibold text-white">
                Back to marketplace
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img src={profile.image} className="h-16 w-16 rounded-2xl object-cover" alt="" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.12em] text-[#6e8b53]">New likeness license</p>
                  <h2 className="font-display text-3xl font-semibold">{profile.name}</h2>
                </div>
              </div>
              <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-[#d6dbd2]" aria-label="Close">
                <Icon name="x" size={18} />
              </button>
            </div>
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#687266]">Usage category</span>
                <select
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  className="w-full rounded-xl border border-[#d5d9d0] bg-white px-4 py-3.5 text-sm"
                >
                  <option>Film & streaming</option>
                  <option>Music video</option>
                  <option>Advertising</option>
                  <option>Gaming</option>
                  <option>Social media</option>
                </select>
              </label>
              <label>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#687266]">License duration</span>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-xl border border-[#d5d9d0] bg-white px-4 py-3.5 text-sm"
                >
                  <option>3 months</option>
                  <option>6 months</option>
                  <option>12 months</option>
                  <option>24 months</option>
                </select>
              </label>
              <label className="sm:col-span-2">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#687266]">Project description</span>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell the creator exactly how their likeness will be used..."
                  className="w-full resize-none rounded-xl border border-[#d5d9d0] bg-white px-4 py-3.5 text-sm"
                />
              </label>
            </div>
            <div className="mt-6 rounded-2xl bg-[#e7eddc] p-5">
              <div className="flex justify-between text-sm">
                <span>{duration} AI likeness license</span>
                <strong>{profile.price}</strong>
              </div>
              <div className="mt-3 flex justify-between text-sm text-[#687563]">
                <span>Platform protection & escrow</span>
                <span>{formatRupees(protection)}</span>
              </div>
              <div className="mt-5 flex items-end justify-between border-t border-[#ccd6c0] pt-5">
                <span className="font-semibold">Estimated total</span>
                <strong className="font-display text-3xl">{formatRupees(total)}</strong>
              </div>
            </div>
            {error ? <p className="mt-4 text-sm text-[#9a3d2f]">{error}</p> : null}
            <button
              onClick={async () => {
                setError("");
                try {
                  await createLicense({
                    talentId: profile.id,
                    buyerId,
                    usage,
                    duration,
                    description,
                  });
                  setPurchased(true);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not submit request");
                }
              }}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-[#172016] px-6 py-4 font-semibold text-white hover:bg-[#283726]"
            >
              <Icon name="shield" size={19} /> Request & secure license
            </button>
            <p className="mt-3 text-center text-xs text-[#7b8478]">No charge until the creator reviews and approves your request.</p>
          </>
        )}
      </div>
    </div>
  );
}
