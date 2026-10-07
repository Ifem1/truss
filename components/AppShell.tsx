import Link from "next/link";
import WalletButton from "@/components/WalletButton";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return <>
    <div className="atmosphere" aria-hidden="true">
      <div className="atmosphere-glow" />
      <svg className="flow-field" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMin slice">
        <defs><linearGradient id="thread-a" x1="0" x2="1"><stop stopColor="#6a67ff" stopOpacity="0"/><stop offset=".48" stopColor="#817cff" stopOpacity=".5"/><stop offset="1" stopColor="#4ad7d0" stopOpacity="0"/></linearGradient><linearGradient id="thread-b" x1="0" x2="1"><stop stopColor="#43c9c8" stopOpacity="0"/><stop offset=".54" stopColor="#9892ff" stopOpacity=".34"/><stop offset="1" stopColor="#746cff" stopOpacity="0"/></linearGradient></defs>
        <g fill="none" strokeWidth="1.2"><path className="flow-line flow-one" stroke="url(#thread-a)" d="M-120 410 C180 40 510 760 820 390 S1330 20 1730 320"/><path className="flow-line flow-two" stroke="url(#thread-b)" d="M-120 520 C230 170 490 880 870 440 S1340 130 1720 480"/><path className="flow-line flow-three" stroke="url(#thread-a)" d="M-100 300 C250 700 440 40 800 310 S1280 790 1710 250"/><path className="flow-line flow-four" stroke="url(#thread-b)" d="M-140 620 C190 200 600 930 900 520 S1370 210 1740 620"/></g>
        <g className="flow-points" fill="#a9a4ff"><circle cx="365" cy="387" r="2"/><circle cx="802" cy="394" r="2.5"/><circle cx="1205" cy="344" r="2"/><circle cx="1002" cy="475" r="1.8"/></g>
      </svg>
      <div className="grain" />
    </div>
    <header className="topbar">
      <Link className="brand" href="/" aria-label="TRUSS home"><span className="brand-mark" aria-hidden="true"><i/><i/><i/></span><span>TRUSS</span></Link>
      <nav aria-label="Main navigation"><Link href="/">Lineages</Link><Link href="/policy/new">Policies</Link><Link href="/release/new">Evaluate</Link></nav>
      <WalletButton />
    </header>
    <main className="shell">{children}</main>
    <footer className="site-footer"><Link className="brand" href="/">TRUSS</Link><span>Release intelligence · GenLayer Studionet 61999</span><span>Evidence in. Lineage forward.</span></footer>
  </>;
}
