import type { Role } from "../types";
import portraits from "../data/portraits";
import Icon from "../components/Icon";
import Logo from "../components/Logo";

export default function Intro({
  onChoose,
  onLogin,
}: {
  onChoose: (role: Role) => void;
  onLogin: () => void;
}) {
  const featured = portraits[0];

  return (
    <main className="min-h-screen bg-[#f4f1e9] text-[#172016]">
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 lg:px-12">
        <Logo />
        <div className="hidden items-center gap-8 text-sm text-[#536052] md:flex">
          <a href="#how">How it works</a>
          <a href="#safety">Safety</a>
          <a href="#talent">For talent</a>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onLogin} className="rounded-full border border-[#bcc3b8] px-5 py-2.5 text-sm font-semibold transition hover:bg-white">
            Login
          </button>
          <button onClick={() => onChoose("buyer")} className="rounded-full border border-[#bcc3b8] px-5 py-2.5 text-sm font-semibold transition hover:bg-white">
            Buyer sign in
          </button>
        </div>
      </nav>

      <section className="mx-auto grid max-w-[1440px] gap-12 px-6 pb-16 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:pt-20">
        <div className="flex flex-col justify-center">
          <div className="mb-8 flex w-fit items-center gap-2 rounded-full bg-[#e0e5da] px-3 py-1.5 text-xs font-bold uppercase tracking-[.16em]">
            <span className="h-2 w-2 rounded-full bg-[#5b7f43]" /> Ethical AI licensing
          </div>
          <h1 className="font-display max-w-[760px] text-[clamp(4rem,8vw,7.5rem)] font-semibold leading-[.86] tracking-[-.075em]">
            Your face.
            <br />
            <span className="font-serif italic font-normal text-[#567743]">Your rights.</span>
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-[#5e685c]">
            A transparent marketplace where creators license their likeness, and brands build responsible AI experiences.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <button
              onClick={() => onChoose("artist")}
              className="group flex items-center gap-6 rounded-full bg-[#172016] py-4 pl-6 pr-4 text-sm font-semibold text-white"
            >
              List your face
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#c9ff44] text-[#172016] transition group-hover:translate-x-1">
                <Icon name="arrow" size={18} />
              </span>
            </button>
            <button onClick={() => onChoose("buyer")} className="rounded-full border border-[#aeb7aa] px-7 py-4 text-sm font-semibold hover:bg-white">
              Explore talent
            </button>
          </div>
          <div className="mt-14 flex flex-wrap gap-6 text-xs font-semibold uppercase tracking-[.11em] text-[#697467]">
            <span className="flex items-center gap-2">
              <Icon name="shield" size={17} /> Verified identities
            </span>
            <span className="flex items-center gap-2">
              <Icon name="check" size={17} /> Consent-first licensing
            </span>
          </div>
        </div>
        <div className="relative min-h-[560px] overflow-hidden rounded-[2.5rem] bg-[#273527]">
          <img className="absolute inset-0 h-full w-full object-cover object-top opacity-90" src={featured.image} alt="Portrait of a creator" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#172016]/80 via-transparent to-transparent" />
          <div className="absolute left-6 top-6 rounded-full bg-white/90 px-4 py-2 text-xs font-bold backdrop-blur">AVAILABLE FOR LICENSING</div>
          <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between text-white">
            <div>
              <p className="text-sm text-white/70">Featured creator</p>
              <h2 className="font-display text-4xl font-semibold tracking-tight">{featured.name}</h2>
            </div>
            <div className="rounded-2xl border border-white/20 bg-black/20 p-4 text-right backdrop-blur">
              <p className="text-xs text-white/70">Audience</p>
              <p className="text-xl font-semibold">{featured.followers}</p>
            </div>
          </div>
        </div>
      </section>
      <div id="how" className="border-t border-[#d8d8cf] px-6 py-6 lg:px-12">
        <div className="mx-auto flex max-w-[1344px] flex-wrap items-center justify-between gap-6 text-sm text-[#667063]">
          <p>
            <strong className="mr-2 text-[#172016]">01</strong> Verify your identity
          </p>
          <p id="safety">
            <strong className="mr-2 text-[#172016]">02</strong> Build your likeness profile
          </p>
          <p id="talent">
            <strong className="mr-2 text-[#172016]">03</strong> Approve every license
          </p>
        </div>
      </div>
    </main>
  );
}
