import { useState } from "react";
import type { User } from "../types";
import { requestLoginOtp, verifyLoginOtp } from "../api/client";
import portraits from "../data/portraits";
import Field from "../components/Field";
import Icon from "../components/Icon";
import Logo from "../components/Logo";

export default function Login({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: (user: User) => void;
}) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode(nextEmail: string) {
    setError("");
    setBusy(true);
    try {
      const result = await requestLoginOtp(nextEmail);
      setEmail(result.email);
      setOtp("");
      setDevOtp(result.devOtp || "");
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send login code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#152015] text-white">
      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-[.72fr_1.28fr]">
        <aside className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between">
          <img src={portraits[3].image} className="absolute inset-0 h-full w-full object-cover opacity-50" alt="" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#142014]/50 to-[#142014]/95" />
          <div className="relative">
            <Logo dark onClick={onBack} />
          </div>
          <div className="relative">
            <p className="mb-4 text-xs font-bold uppercase tracking-[.18em] text-[#c9ff44]">Welcome back</p>
            <h2 className="font-display text-5xl font-semibold leading-[1.02] tracking-tight">Sign in to your account.</h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/65">We will email a one-time code, then open your admin, buyer, or creator studio from your saved role.</p>
          </div>
        </aside>
        <section className="bg-[#f7f5ee] px-6 py-8 text-[#172016] sm:px-12 lg:px-20">
          <div className="mx-auto max-w-2xl">
            <div className="mb-12 flex items-center justify-between">
              <button
                onClick={() => {
                  if (step === "otp") {
                    setStep("email");
                    setOtp("");
                    setError("");
                    return;
                  }
                  onBack();
                }}
                className="flex items-center gap-2 text-sm text-[#687066]"
              >
                <span className="rotate-180">
                  <Icon name="arrow" size={17} />
                </span>{" "}
                Back
              </button>
              <span className="text-xs font-bold uppercase tracking-[.14em] text-[#7b8479]">{step === "email" ? "Step 1 of 2" : "Step 2 of 2"}</span>
            </div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#638746]">Account login</p>
            {step === "email" ? (
              <>
                <h1 className="font-display mt-3 text-5xl font-semibold tracking-[-.05em]">Enter your email</h1>
                <p className="mt-3 text-[#717a6e]">We will send a 6-digit code to the address on your account.</p>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = new FormData(e.currentTarget);
                    await sendCode(String(form.get("email") || email));
                  }}
                  className="mt-10 grid gap-5"
                >
                  <Field
                    name="email"
                    type="email"
                    autoComplete="email"
                    label="Email address"
                    placeholder="name@email.com"
                    value={email}
                    onChange={setEmail}
                  />
                  {error ? <p className="text-sm text-[#9a3d2f]">{error}</p> : null}
                  <button disabled={busy} className="mt-3 flex items-center justify-center gap-3 rounded-full bg-[#172016] px-7 py-4 font-semibold text-white hover:bg-[#273526] disabled:opacity-60">
                    {busy ? "Sending code..." : "Send login code"} <Icon name="arrow" size={18} />
                  </button>
                </form>
              </>
            ) : (
              <>
                <h1 className="font-display mt-3 text-5xl font-semibold tracking-[-.05em]">Check your inbox</h1>
                <p className="mt-3 text-[#717a6e]">
                  Enter the 6-digit code sent to <strong className="text-[#172016]">{email}</strong>.
                </p>
                <form
                  key={`otp-${email}`}
                  autoComplete="off"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError("");
                    setBusy(true);
                    try {
                      const { user } = await verifyLoginOtp(email, otp);
                      onSuccess(user);
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Could not verify code");
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="mt-10 grid gap-5"
                >
                  <Field
                    name="otp"
                    type="text"
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    value={otp}
                    onChange={(value) => setOtp(value.includes("@") ? "" : value.replace(/\D/g, "").slice(0, 6))}
                    label="One-time code"
                    placeholder="000000"
                  />
                  {devOtp ? <p className="text-sm text-[#4f742f]">Local preview code: {devOtp}</p> : null}
                  {error ? <p className="text-sm text-[#9a3d2f]">{error}</p> : null}
                  <button disabled={busy} className="mt-3 flex items-center justify-center gap-3 rounded-full bg-[#172016] px-7 py-4 font-semibold text-white hover:bg-[#273526] disabled:opacity-60">
                    {busy ? "Signing in..." : "Verify and continue"} <Icon name="arrow" size={18} />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => sendCode(email)}
                    className="text-sm font-semibold text-[#536052] underline-offset-4 hover:underline"
                  >
                    Resend code
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
