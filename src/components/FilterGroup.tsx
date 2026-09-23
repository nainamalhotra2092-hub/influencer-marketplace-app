export default function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (option: string) => void;
}) {
  return (
    <div className="mt-6 border-t border-[#e7e9e3] pt-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-[.09em] text-[#758071]">{title}</p>
      {options.map((item) => (
        <label key={item} className="flex cursor-pointer items-center gap-3 py-2 text-sm">
          <input type="checkbox" checked={selected.includes(item)} onChange={() => onToggle(item)} className="accent-[#172016]" />
          {item}
        </label>
      ))}
    </div>
  );
}
