import { useState } from "react";
import Field from "./Field";
import Icon from "./Icon";

export default function OtpModal({
  title,
  description,
  preview,
  busy,
  error,
  onClose,
  onSubmit,
  onResend,
}: {
  title: string;
  description: string;
  preview?: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (code: string) => void;
  onResend: () => void;
}) {
  const [code, setCode] = useState("");

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#11180f]/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-[2rem] bg-[#f8f6ef] p-6 text-[#172016] shadow-2xl md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6e8b53]">Verification</p>
            <h2 className="font-display mt-2 text-3xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-[#6f786c]">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-[#d6dbd2]" aria-label="Close">
            <Icon name="x" size={18} />
          </button>
        </div>
        <form
          className="mt-6 grid gap-4"
          autoComplete="off"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(code);
          }}
        >
          <Field
            name="otp"
            label="One-time code"
            placeholder="000000"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(value) => setCode(value.includes("@") ? "" : value.replace(/\D/g, "").slice(0, 6))}
          />
          {preview ? <p className="text-sm text-[#4f742f]">Local preview code: {preview}</p> : null}
          {error ? <p className="text-sm text-[#9a3d2f]">{error}</p> : null}
          <button disabled={busy} className="rounded-full bg-[#172016] px-6 py-3.5 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? "Verifying..." : "Verify code"}
          </button>
          <button type="button" disabled={busy} onClick={onResend} className="text-sm font-semibold text-[#536052] underline-offset-4 hover:underline">
            Resend code
          </button>
        </form>
      </div>
    </div>
  );
}
