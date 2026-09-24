import { useState } from "react";
import type { Role, User } from "../types";
import { registerUser, requestSignupOtp, verifySignupOtp } from "../api/client";
import portraits from "../data/portraits";
import Field from "../components/Field";
import Icon from "../components/Icon";
import Logo from "../components/Logo";
import OtpModal from "../components/OtpModal";
import VerifyField from "../components/VerifyField";

export default function Register({
  role,
  onBack,
  onContinue,
}: {
  role: Role;
  onBack: () => void;
  onContinue: (user: User) => void;
}) {
  const [emailVerified, setEmailVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState<{
    preview: string;
    target: string;
    error: string;
    busy: boolean;
  } | null>(null);
  const sideImage = role === "artist" ? portraits[2].image : portraits[1].image;

  async function sendOtp() {
    setError("");
    setBusy(true);
    try {
      const result = await requestSignupOtp(email);
      setOtp({ preview: result.devOtp || "", target: result.target, error: "", busy: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send verification code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#152015] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[.72fr_1.28fr]">
        <aside className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
          <img src={sideImage} className="absolute inset-0 h-full w-full object-cover opacity-50" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#142014]/50 to-[#142014]/95" />
          <div className="relative">
            <Logo dark onClick={onBack} />
          </div>
          <div className="relative">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#c9ff44]">{role === "artist" ? "For creators" : "For buyers"}</p>
            <h2 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight">
              {role === "artist" ? "Own your likeness. Shape its future." : "Create with talent, responsibly."}
            </h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/65">Every license is transparent, traceable, and built around real consent.</p>
          </div>
        </aside>
        <section className="bg-[#f7f5ee] px-6 py-8 text-[#172016] sm:px-12 lg:px-20">
          <div className="mx-auto max-w-2xl">
            <div className="mb-12 flex items-center justify-between">
              <button onClick={onBack} className="flex items-center gap-2 text-sm text-[#687066]">
                <span className="rotate-180">
                  <Icon name="arrow" size={17} />
                </span>{" "}
                Back
              </button>
              <span className="text-xs font-bold uppercase tracking-[.14em] text-[#7b8479]">Step 1 of 2</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#638746]">{role === "artist" ? "Creator registration" : "Buyer registration"}</p>
            <h1 className="font-display mt-3 text-5xl font-semibold tracking-[-.05em]">Create your account</h1>
            <p className="mt-3 text-[#717a6e]">Tell us who you are. Your information stays protected.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                setError("");
                if (!emailVerified) {
                  setError("Verify your email before continuing");
                  return;
                }
                try {
                  const { user } = await registerUser({
                    role,
                    name: form.get("name"),
                    phone: form.get("phone"),
                    email,
                    company: form.get("company"),
                    gstin: form.get("gstin"),
                    emailVerified,
                  });
                  onContinue(user);
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Could not create account");
                }
              }}
              className="mt-10 grid gap-5 sm:grid-cols-2"
            >
              <Field name="name" label="Full name" placeholder="Enter legal name" />
              <Field name="phone" type="tel" inputMode="tel" autoComplete="tel" label="Phone number" placeholder="+91 98765 43210" />
              <div className="sm:col-span-2">
                <VerifyField
                  name="email"
                  type="email"
                  label="Email address"
                  placeholder="name@email.com"
                  value={email}
                  onChange={setEmail}
                  verified={emailVerified}
                  busy={busy}
                  onVerify={() => sendOtp()}
                />
              </div>
              {role === "buyer" && (
                <>
                  <Field name="company" label="Company name" placeholder="Legal company name" />
                  <Field name="gstin" label="GSTIN (optional)" placeholder="22AAAAA0000A1Z5" required={false} />
                </>
              )}
              <label className="sm:col-span-2 mt-2 flex cursor-pointer items-start gap-3 text-sm leading-6 text-[#646e62]">
                <input required type="checkbox" className="mt-1 h-4 w-4 accent-[#172016]" />
                <span>
                  I agree to the <u className="font-semibold text-[#172016]">Terms of Service</u>, privacy policy, and consent-based likeness licensing terms.
                </span>
              </label>
              {error ? <p className="sm:col-span-2 text-sm text-[#9a3d2f]">{error}</p> : null}
              <button className="sm:col-span-2 mt-3 flex items-center justify-center gap-3 rounded-full bg-[#172016] px-7 py-4 font-semibold text-white hover:bg-[#273526]">
                Continue <Icon name="arrow" size={18} />
              </button>
            </form>
          </div>
        </section>
      </div>
      {otp ? (
        <OtpModal
          title="Verify your email"
          description={`Enter the 6-digit code sent to ${otp.target}.`}
          preview={otp.preview}
          busy={otp.busy}
          error={otp.error}
          onClose={() => setOtp(null)}
          onResend={() => sendOtp()}
          onSubmit={async (code) => {
            setOtp((current) => (current ? { ...current, busy: true, error: "" } : current));
            try {
              await verifySignupOtp(email, code);
              setEmailVerified(true);
              setOtp(null);
            } catch (err) {
              setOtp((current) =>
                current ? { ...current, busy: false, error: err instanceof Error ? err.message : "Could not verify code" } : current,
              );
            }
          }}
        />
      ) : null}
    </main>
  );
}
