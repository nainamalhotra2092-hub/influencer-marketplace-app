import Icon from "./Icon";

export default function VerifyField({
  label,
  placeholder,
  verified,
  onVerify,
  name,
  type = "text",
  value,
  onChange,
  busy,
}: {
  label: string;
  placeholder: string;
  verified: boolean;
  onVerify: () => void;
  name?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  busy?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#687266]">{label}</span>
      <div className={`flex items-center rounded-xl border bg-white p-1 ${verified ? "border-[#8fb56a]" : "border-[#d5d9d0] focus-within:border-[#66864d]"}`}>
        <input
          required
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          readOnly={verified}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
        />
        {verified ? (
          <span className="mr-1 grid h-10 w-10 place-items-center rounded-full bg-[#5b7f43] text-white" aria-label="Verified">
            <Icon name="check" size={18} />
          </span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={onVerify}
            className="rounded-lg bg-[#172016] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60"
          >
            {busy ? "SENDING" : "VERIFY"}
          </button>
        )}
      </div>
    </label>
  );
}
