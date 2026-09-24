export default function Logo({ dark = false, onClick }: { dark?: boolean; onClick?: () => void }) {
  const content = (
    <>
      <div className={`grid h-9 w-9 place-items-center rounded-full ${dark ? "bg-[#c9ff44] text-[#152013]" : "bg-[#172016] text-[#c9ff44]"}`}>
        <span className="text-lg font-bold">F</span>
      </div>
      <span className="font-display text-xl font-bold tracking-[-0.04em]">
        FACE<span className="font-normal">TROOP</span>
      </span>
    </>
  );

  if (!onClick) {
    return <div className="flex items-center gap-2.5">{content}</div>;
  }

  return (
    <button type="button" onClick={onClick} className="flex items-center gap-2.5" aria-label="FACETROOP home">
      {content}
    </button>
  );
}
