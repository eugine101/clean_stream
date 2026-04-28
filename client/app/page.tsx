"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, LineChart, Shield, Zap, Users, CheckCircle2, Upload, ArrowUpRight } from "lucide-react";

/* ─── Logo Mark ─── */
function CleanStreamMark({ size = 36 }: { size?: number }) {
  const cx = size / 2, cy = size / 2;
  const path = `M${cx} ${cy - size * 0.35} C${cx + size * 0.14} ${cy - size * 0.35} ${cx + size * 0.22} ${cy - size * 0.1} ${cx + size * 0.08} ${cy + size * 0.04} C${cx - size * 0.06} ${cy + size * 0.18} ${cx - size * 0.22} ${cy + size * 0.1} ${cx - size * 0.08} ${cy - size * 0.06} C${cx - size * 0.01} ${cy - size * 0.18} ${cx} ${cy - size * 0.3} ${cx} ${cy - size * 0.35} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <path d={path} fill="#2d9e5f" />
      <path d={path} fill="#1a1a1a" transform={`rotate(120 ${cx} ${cy})`} />
      <path d={path} fill="#8fb8b8" transform={`rotate(240 ${cx} ${cy})`} />
    </svg>
  );
}

/* ─── Count-up hook ─── */
function useCountUp(target: number, duration = 2000, suffix = "", decimals = 0) {
  const [value, setValue] = useState("0" + suffix);
  const started = useRef(false);
  const start = (delay = 0) => {
    if (started.current) return;
    started.current = true;
    setTimeout(() => {
      const steps = Math.ceil(duration / 16);
      let step = 0;
      const timer = setInterval(() => {
        step++;
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        setValue(
          decimals > 0
            ? current.toFixed(decimals) + suffix
            : Math.floor(current) + suffix
        );
        if (step >= steps) {
          setValue(target.toFixed(decimals) + suffix);
          clearInterval(timer);
        }
      }, 16);
    }, delay);
  };
  return { value, start };
}

/* ─── Intersection hook ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Data ─── */
const features = [
  { icon: Upload, title: "Smart Upload", description: "Drag-and-drop interface with real-time validation and progress tracking for seamless uploads." },
  { icon: LineChart, title: "Analytics Dashboard", description: "Comprehensive insights with interactive charts and real-time metrics to monitor your data flow." },
  { icon: Shield, title: "Data Validation", description: "Automatic error detection and data quality checks ensure clean, reliable uploads every time." },
  { icon: Users, title: "Team Collaboration", description: "Share uploads, track team activity, and collaborate seamlessly across your organization." },
  { icon: Zap, title: "Lightning Fast", description: "Process millions of rows in seconds with our optimized data processing pipeline." },
  { icon: CheckCircle2, title: "Complete History", description: "Track every upload with detailed logs, status updates, and the ability to re-process data." },
];

const testimonials = [
  { quote: "CleanStream transformed our data workflow. What used to take hours now takes minutes.", author: "Sarah Chen", role: "Data Engineer at TechCorp", avatar: "SC" },
  { quote: "The validation features caught errors we didn't even know existed. Absolutely essential.", author: "Michael Rodriguez", role: "Analytics Lead at DataFlow", avatar: "MR" },
  { quote: "Best data upload tool we've used. The interface is intuitive and the processing is lightning fast.", author: "Emily Watson", role: "CTO at StartupHub", avatar: "EW" },
];

const footerLinks = [
  { heading: "Product", links: ["Features", "Pricing", "Security"] },
  { heading: "Company", links: ["About", "Blog", "Careers"] },
  { heading: "Resources", links: ["Documentation", "API", "Support"] },
  { heading: "Legal", links: ["Privacy", "Terms"] },
];

/* ─── Progress Bar ─── */
function ProgressBar({ label, pct, delay, active }: { label: string; pct: number; delay: number; active: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 11, color: "#2d9e5f", fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: "#f0faf4", borderRadius: 100, overflow: "hidden" }}>
        <div
          style={{
            height: "100%", borderRadius: 100,
            background: "linear-gradient(90deg, #2d9e5f, #4ade80)",
            width: active ? `${pct}%` : "0%",
            transition: `width 1.4s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const rows = useCountUp(2847, 2000);
  const errs = useCountUp(3, 2000);
  const qual = useCountUp(99, 2000, "%");

  const { ref: featRef, inView: featIn } = useInView(0.1);
  const { ref: statsRef, inView: statsIn } = useInView(0.2);
  const { ref: cardRef, inView: cardIn } = useInView(0.3);

  useEffect(() => {
    if (cardIn) {
      setTimeout(() => { rows.start(); errs.start(); qual.start(); }, 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardIn]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* Subtle noise texture overlay */
        body::after {
          content: '';
          position: fixed; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
          pointer-events: none; z-index: 9999; opacity: 0.4;
        }

        /* Hero animations */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-badge { animation: fadeUp .6s .1s both; }
        .anim-h1    { animation: fadeUp .7s .2s both; }
        .anim-p     { animation: fadeUp .6s .35s both; }
        .anim-ctas  { animation: fadeUp .6s .5s both; }
        .anim-trust { animation: fadeUp .6s .62s both; }
        .anim-card  { animation: fadeUp .8s .3s both; }

        /* Card subtle float */
        @keyframes cardFloat {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-8px); }
        }
        .card-float { animation: cardFloat 7s ease-in-out infinite; }

        /* Pulse */
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.4; }
        }
        .pulse-dot { animation: pulse 2s ease-in-out infinite; }

        /* Hover states */
        .feature-card {
          transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
          cursor: default;
        }
        .feature-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.07);
          border-color: #2d9e5f !important;
        }

        .testimonial-card {
          transition: transform .22s ease, box-shadow .22s ease;
        }
        .testimonial-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.07);
        }

        .btn-primary {
          transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(45,158,95,0.35);
          background: #259952 !important;
        }

        .btn-outline {
          transition: background .18s ease, border-color .18s ease, color .18s ease;
        }
        .btn-outline:hover {
          background: #f0faf4 !important;
          border-color: #2d9e5f !important;
          color: #2d9e5f !important;
        }

        .nav-link {
          transition: color .15s ease;
          color: #374151;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 6px;
        }
        .nav-link:hover { color: #2d9e5f; }

        .footer-link {
          color: #6b7280;
          transition: color .15s ease;
          text-decoration: none;
          font-size: 14px;
          line-height: 1;
        }
        .footer-link:hover { color: #111827; }

        /* Divider line */
        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent);
          border: none;
          margin: 0;
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#ffffff", fontFamily: "'DM Sans', sans-serif", color: "#111827", position: "relative" }}>

        {/* ── NAV ── */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 100,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(20px)",
          borderBottom: "1px solid #e5e7eb",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <CleanStreamMark size={30} />
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "#111827", letterSpacing: "-.01em" }}>CleanStream</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: "#6b7280", letterSpacing: ".04em", marginTop: -1 }}>TECH THAT CLEARS THE WAY</div>
              </div>
            </div>

            {/* Nav links */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Link href="/dashboard" className="nav-link">Features</Link>
              <Link href="#" className="nav-link">Pricing</Link>
              <Link href="#" className="nav-link">Docs</Link>
            </div>

            {/* Auth */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/auth/login">
                <button className="btn-outline" style={{ background: "transparent", border: "1px solid #d1d5db", color: "#374151", padding: "7px 18px", borderRadius: 8, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                  Sign in
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="btn-primary" style={{ background: "#2d9e5f", color: "#ffffff", padding: "8px 20px", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 6 }}>
                  Get started <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ position: "relative", overflow: "hidden", background: "#ffffff" }}>

          {/* Subtle background grid */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: "linear-gradient(#f3f4f6 1px, transparent 1px), linear-gradient(90deg, #f3f4f6 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 40%, transparent 100%)",
          }} />

          {/* Green radial accent top-right */}
          <div style={{ position: "absolute", top: -100, right: -80, width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(45,158,95,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 2.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", alignItems: "center", gap: "5rem", minHeight: "calc(100vh - 64px)", position: "relative", zIndex: 1 }}>

            {/* Left */}
            <div style={{ paddingTop: 80, paddingBottom: 80 }}>

              {/* Status badge */}
              <div className="anim-badge" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0faf4", border: "1px solid #bbf7d0", borderRadius: 100, padding: "5px 14px 5px 10px", marginBottom: 32 }}>
                <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#2d9e5f", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "#2d9e5f", fontWeight: 600 }}>Now processing 10M+ rows daily</span>
              </div>

              <h1 className="anim-h1" style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: "clamp(40px, 5vw, 64px)",
                fontWeight: 400,
                lineHeight: 1.1,
                color: "#111827",
                marginBottom: 22,
                letterSpacing: "-.02em",
              }}>
                Clean, validate &amp;<br />
                <span style={{ fontStyle: "italic", color: "#2d9e5f" }}>upload data</span><br />
                at any scale.
              </h1>

              <p className="anim-p" style={{ fontSize: 17, lineHeight: 1.75, color: "#4b5563", maxWidth: 460, marginBottom: 36, fontWeight: 300 }}>
                CleanStream empowers data teams to handle large-scale uploads with
                intelligent validation, real-time processing, and full history tracking.
              </p>

              <div className="anim-ctas" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 44 }}>
                <Link href="/auth/signup">
                  <button className="btn-primary" style={{ height: 50, padding: "0 28px", borderRadius: 10, fontSize: 15, fontWeight: 600, background: "#2d9e5f", color: "#ffffff", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                    Start free trial <ArrowRight size={16} />
                  </button>
                </Link>
                <Link href="/dashboard">
                  <button className="btn-outline" style={{ height: 50, padding: "0 28px", borderRadius: 10, fontSize: 15, fontWeight: 500, background: "transparent", color: "#374151", border: "1px solid #d1d5db", cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
                    View demo
                  </button>
                </Link>
              </div>

              <div className="anim-trust" style={{ display: "flex", gap: 28, flexWrap: "wrap", paddingTop: 20, borderTop: "1px solid #f3f4f6" }}>
                {["500+ teams", "99.9% uptime", "No credit card"].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="7" fill="#f0faf4" />
                      <path d="M4 7l2 2 4-4" stroke="#2d9e5f" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 400 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dashboard card */}
            <div ref={cardRef} className="anim-card" style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", paddingTop: 60, paddingBottom: 60 }}>

              {/* Floating status badge — top left */}
              <div style={{
                position: "absolute", top: "14%", left: "-4%",
                background: "#ffffff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
                border: "1px solid #e5e7eb", padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 10, zIndex: 10,
                animation: "cardFloat 7s ease-in-out infinite",
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 7.5l4 4 7-7" stroke="#2d9e5f" strokeWidth="2" strokeLinecap="round" /></svg>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Validation passed</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>2,847 rows clean</div>
                </div>
              </div>

              {/* Floating speed badge — bottom right */}
              <div style={{
                position: "absolute", bottom: "20%", right: "-4%",
                background: "#ffffff", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
                border: "1px solid #e5e7eb", padding: "10px 14px",
                display: "flex", alignItems: "center", gap: 10, zIndex: 10,
                animation: "cardFloat 8s ease-in-out infinite .5s",
              }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Zap size={15} style={{ color: "#d97706" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>Processing speed</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>1.2s average</div>
                </div>
              </div>

              {/* Main card */}
              <div className="card-float" style={{
                width: "100%", maxWidth: 420,
                borderRadius: 20, overflow: "hidden",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                boxShadow: "0 24px 64px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.06)",
              }}>
                {/* Window chrome */}
                <div style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb", padding: "12px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["#f87171", "#fbbf24", "#4ade80"].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />)}
                  </div>
                  <span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 500, letterSpacing: ".02em" }}>cleanstream_upload.csv</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#2d9e5f", fontWeight: 600 }}>
                    <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#2d9e5f" }} />
                    Live
                  </div>
                </div>

                {/* Upload drop zone */}
                <div style={{ padding: "22px 20px 16px" }}>
                  <div style={{ border: "2px dashed #d1d5db", borderRadius: 12, padding: "28px 20px", textAlign: "center", background: "#fafafa" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, margin: "0 auto 12px", background: "#f0faf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Upload size={20} style={{ color: "#2d9e5f" }} />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", marginBottom: 4 }}>Drop your data file here</div>
                    <div style={{ fontSize: 12, color: "#9ca3af" }}>CSV, XLSX, JSON — up to 500MB</div>
                  </div>
                </div>

                {/* Progress bars */}
                <div style={{ padding: "4px 20px 16px" }}>
                  <ProgressBar label="Data Validation" pct={87} delay={0}   active={cardIn} />
                  <ProgressBar label="Deduplication"   pct={62} delay={200} active={cardIn} />
                  <ProgressBar label="Schema Check"    pct={94} delay={400} active={cardIn} />
                </div>

                {/* Stats */}
                <div style={{ padding: "0 20px 20px", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {[
                    { num: rows.value, label: "Rows Clean" },
                    { num: errs.value, label: "Errors" },
                    { num: qual.value, label: "Quality" },
                  ].map(({ num, label }, i) => (
                    <div key={i} style={{ borderRadius: 10, padding: "12px 8px", background: i === 0 ? "#f0faf4" : "#f9fafb", border: `1px solid ${i === 0 ? "#bbf7d0" : "#e5e7eb"}`, textAlign: "center" }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: i === 0 ? "#2d9e5f" : "#111827", fontFamily: "'DM Sans', sans-serif" }}>{num}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, fontWeight: 500 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="section-divider" />

        {/* ── LOGOS / SOCIAL PROOF BAR ── */}
        <div style={{ background: "#fafafa", padding: "32px 2.5rem" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <p style={{ textAlign: "center", fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#9ca3af", marginBottom: 24 }}>Trusted by teams at</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 48, flexWrap: "wrap", alignItems: "center" }}>
              {["TechCorp", "DataFlow", "StartupHub", "Nexus Analytics", "Meridian"].map((name, i) => (
                <span key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "#d1d5db", letterSpacing: "-.01em" }}>{name}</span>
              ))}
            </div>
          </div>
        </div>

        <hr className="section-divider" />

        {/* ── FEATURES ── */}
        <section style={{ padding: "96px 2.5rem", background: "#ffffff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            <div style={{ marginBottom: 60 }}>
              <div style={{ display: "inline-block", fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#2d9e5f", marginBottom: 14 }}>Features</div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 400, color: "#111827", lineHeight: 1.2, letterSpacing: "-.02em", maxWidth: 480 }}>
                Everything you need to manage data at scale
              </h2>
            </div>

            <div ref={featRef} style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="feature-card"
                  style={{
                    padding: "32px 28px",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: i === 0 ? "12px 0 0 0" : i === 2 ? "0 12px 0 0" : i === 3 ? "0 0 0 12px" : i === 5 ? "0 0 12px 0" : "0",
                    opacity: featIn ? 1 : 0,
                    transform: featIn ? "translateY(0)" : "translateY(24px)",
                    transition: `opacity .5s ${i * 80}ms, transform .5s ${i * 80}ms`,
                    marginTop: i > 2 ? -1 : 0,
                    marginLeft: i % 3 !== 0 ? -1 : 0,
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f0faf4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <feature.icon size={18} style={{ color: "#2d9e5f" }} />
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 8 }}>{feature.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.65, color: "#6b7280", fontWeight: 300 }}>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="section-divider" />

        {/* ── STATS ── */}
        <div style={{ background: "#111827", padding: "72px 2.5rem" }}>
          <div ref={statsRef} style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 24, textAlign: "center" }}>
            {[["10M+", "Rows Processed Daily"], ["99.9%", "Uptime SLA"], ["500+", "Teams Worldwide"], ["< 2s", "Avg Processing Time"]].map(([num, label], i) => (
              <div key={i} style={{
                opacity: statsIn ? 1 : 0, transform: statsIn ? "translateY(0)" : "translateY(20px)",
                transition: `opacity .5s ${i * 100}ms, transform .5s ${i * 100}ms`
              }}>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(36px, 4vw, 52px)", fontWeight: 400, color: "#ffffff", letterSpacing: "-.02em" }}>{num}</div>
                <div style={{ fontSize: 13, color: "#9ca3af", marginTop: 6, fontWeight: 400 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TESTIMONIALS ── */}
        <section style={{ padding: "96px 2.5rem", background: "#fafafa" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            <div style={{ marginBottom: 56 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase", color: "#2d9e5f", marginBottom: 14 }}>Testimonials</div>
              <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(26px, 3vw, 40px)", fontWeight: 400, color: "#111827", lineHeight: 1.2, letterSpacing: "-.02em" }}>
                Trusted by data teams worldwide
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
              {testimonials.map((t, i) => (
                <div key={i} className="testimonial-card" style={{
                  borderRadius: 16, padding: "28px 24px",
                  background: "#ffffff",
                  border: "1px solid #e5e7eb",
                }}>
                  {/* Stars */}
                  <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                    {[...Array(5)].map((_, si) => (
                      <svg key={si} width="13" height="13" viewBox="0 0 13 13" fill="#f59e0b"><path d="M6.5 1l1.5 3.1 3.4.5-2.5 2.4.6 3.4L6.5 9 3 10.4l.6-3.4L1 4.6l3.4-.5z"/></svg>
                    ))}
                  </div>
                  <p style={{ fontStyle: "italic", lineHeight: 1.75, fontSize: 14, color: "#374151", marginBottom: 24, fontFamily: "'Instrument Serif', serif", fontWeight: 400 }}>"{t.quote}"</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#f0faf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#2d9e5f", flexShrink: 0 }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#111827" }}>{t.author}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 1 }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ padding: "0 2.5rem 96px", background: "#fafafa" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{
              borderRadius: 24, padding: "72px 40px",
              textAlign: "center", position: "relative", overflow: "hidden",
              background: "#111827",
            }}>
              {/* Subtle green accent */}
              <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 400, height: 200, background: "radial-gradient(ellipse, rgba(45,158,95,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />

              <div style={{ position: "relative" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(45,158,95,0.15)", border: "1px solid rgba(45,158,95,0.3)", borderRadius: 100, padding: "5px 16px 5px 10px", marginBottom: 28 }}>
                  <div className="pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#2d9e5f" }} />
                  <span style={{ fontSize: 12, color: "#4ade80", fontWeight: 600 }}>Free 14-day trial</span>
                </div>

                <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 400, color: "#ffffff", marginBottom: 16, letterSpacing: "-.02em", lineHeight: 1.15 }}>
                  Ready to clean your data?
                </h2>
                <p style={{ fontSize: 16, color: "#9ca3af", maxWidth: 460, margin: "0 auto 36px", lineHeight: 1.7, fontWeight: 300 }}>
                  Join 500+ teams who trust CleanStream to power their data pipelines. Start free — no credit card required.
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  <Link href="/auth/signup">
                    <button className="btn-primary" style={{ height: 50, padding: "0 32px", borderRadius: 10, fontSize: 15, fontWeight: 600, background: "#2d9e5f", color: "#ffffff", border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                      Start free trial <ArrowRight size={16} />
                    </button>
                  </Link>
                  <Link href="/auth/login">
                    <button style={{ height: 50, padding: "0 32px", borderRadius: 10, fontSize: 15, fontWeight: 500, background: "transparent", color: "#9ca3af", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "color .18s, border-color .18s" }}>
                      Sign in instead
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: "1px solid #e5e7eb", background: "#ffffff" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 2.5rem 40px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr 1fr 1fr 1fr", gap: 32, marginBottom: 48 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <CleanStreamMark size={26} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#111827", letterSpacing: "-.01em" }}>CleanStream</span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.75, color: "#6b7280", fontWeight: 300, maxWidth: 240 }}>
                  Tech That Clears The Way. Enterprise-grade data cleaning for modern data teams.
                </p>
              </div>
              {footerLinks.map(col => (
                <div key={col.heading}>
                  <h3 style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: ".1em", color: "#111827", marginBottom: 16 }}>{col.heading}</h3>
                  <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {col.links.map(link => (
                      <li key={link}><Link href="/dashboard" className="footer-link">{link}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: 24, borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>© 2025 CleanStream. All rights reserved.</span>
              <div style={{ display: "flex", gap: 20 }}>
                {["Privacy", "Terms", "Cookies"].map(link => (
                  <Link key={link} href="#" style={{ fontSize: 12, color: "#9ca3af", textDecoration: "none" }}>{link}</Link>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}