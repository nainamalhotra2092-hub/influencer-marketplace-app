import type { Portrait, Upload } from "../types";
import Icon from "./Icon";

export default function TalentProfilePanel({
  talent,
  uploads,
  onClose,
  action,
}: {
  talent: Portrait;
  uploads: Upload[];
  onClose: () => void;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#11180f]/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        onMouseDown={(event) => event.stopPropagation()}
        className="mx-auto my-8 max-w-5xl rounded-[2rem] bg-[#f8f6ef] p-6 text-[#172016] shadow-2xl md:p-10"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6e8b53]">Creator profile</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-3">
              <h2 className="font-display text-4xl font-semibold">{talent.name}</h2>
              {action ? (
                <button type="button" onClick={action.onClick} className="h-11 shrink-0 rounded-full bg-[#172016] px-6 text-sm font-semibold text-white">
                  {action.label}
                </button>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-[#6f786c]">{talent.type}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#d6dbd2]" aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <p className="rounded-2xl bg-white p-4 text-sm">
            <span className="block text-[10px] font-bold uppercase tracking-[.1em] text-[#687266]">Age</span>
            <strong className="mt-1 block text-lg">{talent.age || "—"}</strong>
          </p>
          <p className="rounded-2xl bg-white p-4 text-sm">
            <span className="block text-[10px] font-bold uppercase tracking-[.1em] text-[#687266]">Ethnicity</span>
            <strong className="mt-1 block text-lg">{talent.ethnicity || "—"}</strong>
          </p>
          <p className="rounded-2xl bg-white p-4 text-sm">
            <span className="block text-[10px] font-bold uppercase tracking-[.1em] text-[#687266]">City</span>
            <strong className="mt-1 block text-lg">{talent.city || "—"}</strong>
          </p>
          <p className="rounded-2xl bg-white p-4 text-sm">
            <span className="block text-[10px] font-bold uppercase tracking-[.1em] text-[#687266]">Instagram followers</span>
            <strong className="mt-1 block text-lg">{talent.followers || "—"}</strong>
          </p>
          <p className="rounded-2xl bg-white p-4 text-sm">
            <span className="block text-[10px] font-bold uppercase tracking-[.1em] text-[#687266]">Collaborations</span>
            <strong className="mt-1 block text-lg">{talent.collaborations ?? 0}</strong>
          </p>
          <p className="rounded-2xl bg-white p-4 text-sm">
            <span className="block text-[10px] font-bold uppercase tracking-[.1em] text-[#687266]">Instagram link</span>
            {talent.instagram ? (
              <a href={talent.instagram} target="_blank" rel="noreferrer" className="mt-1 block break-all text-lg font-semibold underline">
                {talent.instagram}
              </a>
            ) : (
              <strong className="mt-1 block text-lg">—</strong>
            )}
          </p>
        </div>
        <div className="mt-6 rounded-2xl bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#687266]">Short bio</p>
          <p className="mt-2 text-sm leading-6 text-[#5f695c]">{talent.bio || "No bio yet."}</p>
        </div>
        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[.13em] text-[#6c7867]">Uploaded pictures</p>
          {uploads.length === 0 ? (
            <p className="mt-4 text-sm text-[#6f786c]">This creator has not uploaded any pictures yet.</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uploads.map((upload) => (
                <figure key={upload.id} className="overflow-hidden rounded-3xl bg-white">
                  <img src={upload.image} alt={upload.title} className="aspect-[4/5] w-full object-cover" />
                  <figcaption className="p-3 text-sm font-semibold">{upload.title}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
