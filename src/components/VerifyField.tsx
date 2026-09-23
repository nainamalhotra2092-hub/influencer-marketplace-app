import Icon from "./Icon";

export default function VerifyField({
  label,
  placeholder,
  verified,
  onVerify,
  name,
  type = "text",
}: {
  label: string;
  placeholder: string;
  verified: boolean;
  onVerify: () => void;
  name?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#687266]">{label}</span>
      <div className="flex rounded-xl border border-[#d5d9d0] bg-white p-1 focus-within:border-[#66864d]">
        <input required name={name} type={type} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
        <button
          type="button"
          onClick={onVerify}
          className={`rounded-lg px-4 py-2.5 text-xs font-bold ${verified ? "bg-[#e9f6d7] text-[#4f742f]" : "bg-[#172016] text-white"}`}
        >
          {verified ? (
            <span className="flex items-center gap-1">
              <Icon name="check" size={14} /> Verified
            </span>
          ) : (
            "VERIFY"
          )}
        </button>
      </div>
    </label>
  );
}
