export default function Field({
  label,
  placeholder,
  type = "text",
  name,
  autoComplete,
  inputMode,
  maxLength,
  autoFocus,
  required = true,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  name?: string;
  autoComplete?: string;
  inputMode?: "text" | "email" | "numeric" | "tel";
  maxLength?: number;
  autoFocus?: boolean;
  required?: boolean;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#687266]">{label}</span>
      <input
        required={required}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        maxLength={maxLength}
        autoFocus={autoFocus}
        value={value}
        defaultValue={value === undefined ? defaultValue : undefined}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        className="w-full rounded-xl border border-[#d5d9d0] bg-white px-4 py-3.5 text-sm outline-none transition focus:border-[#66864d] focus:ring-2 focus:ring-[#66864d]/10"
      />
    </label>
  );
}
