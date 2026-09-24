import { useEffect, useRef, useState } from "react";
import type { Upload, User } from "../types";
import { addStudioMedia, deleteStudioMedia, fetchStudio, setStudioPrimary } from "../api/client";
import Icon from "../components/Icon";
import Shell from "../components/Shell";
import StatCard from "../components/StatCard";

function formatRupees(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

function readImageFile(file: File) {
  return new Promise<{ data: string; mime: string; name: string }>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Choose a photo from your device"));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Image must be under 8 MB"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const data = result.includes(",") ? result.split(",")[1] : result;
      if (!data) {
        reject(new Error("Could not read that image"));
        return;
      }
      resolve({ data, mime: file.type || "image/jpeg", name: file.name || "Studio photo" });
    };
    reader.onerror = () => reject(new Error("Could not read that image"));
    reader.readAsDataURL(file);
  });
}

export default function ArtistDashboard({
  user,
  onLogout,
  onHome,
  onEditProfile,
  onUserChange,
}: {
  user: User;
  onLogout: () => void;
  onHome: () => void;
  onEditProfile: () => void;
  onUserChange: (user: User) => void;
}) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [completion, setCompletion] = useState(40);
  const [stats, setStats] = useState({ views: 0, shortlists: 0, licenses: 0, earnings: 0 });
  const [pickerOpen, setPickerOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const firstName = user.name.split(" ")[0] || "there";

  useEffect(() => {
    fetchStudio(user.id)
      .then((data) => {
        setUploads(data.uploads);
        setCompletion(data.completion);
        setStats(data.stats);
        onUserChange(data.user);
      })
      .catch(() => undefined);
  }, [user.id]);

  const onPrimary = async (upload: Upload) => {
    if (upload.primary) return;
    setError("");
    try {
      await setStudioPrimary(user.id, upload.id);
      setUploads((current) => current.map((item) => ({ ...item, primary: item.id === upload.id })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not set primary image");
    }
  };

  const onFile = async (file?: File | null) => {
    if (!file) return;
    setError("");
    setBusy(true);
    setPickerOpen(false);
    try {
      const payload = await readImageFile(file);
      const { media } = await addStudioMedia(user.id, payload);
      setUploads((current) => {
        const next = [...current, media];
        return media.primary ? next.map((item) => ({ ...item, primary: item.id === media.id })) : next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload image");
    } finally {
      setBusy(false);
      if (galleryRef.current) galleryRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  return (
    <Shell user={user} onLogout={onLogout} onHome={onHome}>
      <input ref={galleryRef} type="file" accept="image/*" className="hidden" onChange={(event) => onFile(event.target.files?.[0])} />
      <input ref={cameraRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(event) => onFile(event.target.files?.[0])} />
      <main className="mx-auto max-w-[1500px] px-5 py-10 lg:px-10">
        <section className="grid gap-5 lg:grid-cols-[1.5fr_.5fr]">
          <div className="rounded-[2rem] bg-[#172016] p-8 text-white md:p-10">
            <p className="text-xs font-bold uppercase tracking-[.15em] text-[#c9ff44]">Creator studio</p>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h1 className="font-display text-5xl font-semibold tracking-[-.05em]">Good morning, {firstName}.</h1>
                <p className="mt-3 text-white/60">Your profile is {completion}% complete. Add more expressions to get discovered.</p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => setPickerOpen(true)}
                className="flex items-center gap-2 rounded-full bg-[#c9ff44] px-5 py-3 text-sm font-bold text-[#172016] disabled:opacity-60"
              >
                <Icon name="upload" size={18} /> {busy ? "Uploading..." : "Upload media"}
              </button>
            </div>
          </div>
          <div className="rounded-[2rem] bg-[#dce9cc] p-8">
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-bold uppercase tracking-[.12em] text-[#5d7250]">Profile health</p>
              <button
                type="button"
                onClick={onEditProfile}
                aria-label="Edit profile"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/80 text-[#172016] hover:bg-white"
              >
                <Icon name="pen" size={17} />
              </button>
            </div>
            <p className="font-display mt-4 text-5xl font-semibold">{completion}%</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/60">
              <div className="h-full bg-[#5e7f45]" style={{ width: `${completion}%` }} />
            </div>
            <p className="mt-4 text-xs text-[#5e6d54]">Verified and visible to buyers</p>
          </div>
        </section>
        {error ? <p className="mt-6 text-sm text-[#9a3d2f]">{error}</p> : null}
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
                <button type="button" onClick={() => onPrimary(upload)} className="h-full w-full text-left">
                  <img src={upload.image} alt={upload.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </button>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <button
                  type="button"
                  onClick={() => onPrimary(upload)}
                  aria-label={upload.primary ? `${upload.title} is the primary image` : `Make ${upload.title} the primary image`}
                  className={`absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full shadow-lg ${upload.primary ? "bg-[#c9ff44] text-[#172016]" : "bg-white/90 text-[#172016]"}`}
                >
                  <Icon name="star" size={18} filled={Boolean(upload.primary)} />
                </button>
                <div className="pointer-events-none absolute bottom-5 left-5 text-white">
                  <p className="font-semibold">{upload.title}</p>
                  <p className="text-xs text-white/60">{upload.primary ? "Primary image" : "Encrypted in storage"}</p>
                </div>
                <button
                  onClick={async () => {
                    await deleteStudioMedia(user.id, upload.id);
                    setUploads((current) => {
                      const remaining = current.filter((item) => item.id !== upload.id);
                      if (!upload.primary) return remaining;
                      const nextPrimary = remaining[remaining.length - 1];
                      return remaining.map((item) => ({ ...item, primary: item.id === nextPrimary?.id }));
                    });
                  }}
                  className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-[#172016] opacity-0 transition group-hover:opacity-100"
                  aria-label={`Delete ${upload.title}`}
                >
                  <Icon name="trash" size={16} />
                </button>
              </article>
            ))}
            <button
              type="button"
              disabled={busy}
              onClick={() => setPickerOpen(true)}
              className="grid aspect-[4/5] place-items-center rounded-3xl border-2 border-dashed border-[#bdc6b8] text-center text-[#687365] hover:bg-white disabled:opacity-60"
            >
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#e0e7d9]">
                  <Icon name="plus" />
                </span>
                <p className="mt-3 font-semibold">Add another</p>
                <p className="mt-1 text-xs">Device, gallery or camera</p>
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
      {pickerOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[#11180f]/70 p-4 backdrop-blur-sm" onMouseDown={() => setPickerOpen(false)}>
          <div
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[2rem] bg-[#f8f6ef] p-6 text-[#172016] shadow-2xl"
          >
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6e8b53]">Upload media</p>
            <h2 className="font-display mt-2 text-3xl font-semibold">Add a photo</h2>
            <p className="mt-2 text-sm text-[#6f786c]">Choose a file from this device, pick from your gallery, or open the camera.</p>
            <div className="mt-6 grid gap-3">
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex items-center gap-3 rounded-2xl border border-[#d6dbd2] bg-white px-4 py-3.5 text-left font-semibold"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e0e7d9]">
                  <Icon name="upload" size={18} />
                </span>
                Choose from device / gallery
              </button>
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex items-center gap-3 rounded-2xl border border-[#d6dbd2] bg-white px-4 py-3.5 text-left font-semibold"
              >
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e0e7d9]">
                  <Icon name="camera" size={18} />
                </span>
                Open camera
              </button>
              <button type="button" onClick={() => setPickerOpen(false)} className="pt-1 text-sm font-semibold text-[#536052]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
