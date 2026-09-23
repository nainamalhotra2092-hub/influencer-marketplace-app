export default function Field({
  label,
  placeholder,
  type = "text",
  name,
}: {
  label: string;
  placeholder: string;
  type?: string;
  name?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#687266]">{label}</span>
      <input
        required
        name={name}
        type={type}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#d5d9d0] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#66864d] focus:ring-2 focus:ring-[#66864d]/10"
      />
    </label>
  );
}
