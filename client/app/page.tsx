"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, LineChart, Shield, Zap, Users, CheckCircle2, Upload } from "lucide-react";

/* ─── Logo Mark ─── */
function CleanStreamMark({ size = 36 }: { size?: number }) {
  const cx = size / 2, cy = size / 2;
  const path = `M${cx} ${cy - size * 0.35} C${cx + size * 0.14} ${cy - size * 0.35} ${cx + size * 0.22} ${cy - size * 0.1} ${cx + size * 0.08} ${cy + size * 0.04} C${cx - size * 0.06} ${cy + size * 0.18} ${cx - size * 0.22} ${cy + size * 0.1} ${cx - size * 0.08} ${cy - size * 0.06} C${cx - size * 0.01} ${cy - size * 0.18} ${cx} ${cy - size * 0.3} ${cx} ${cy - size * 0.35} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <path d={path} fill="#4caf72" />
      <path d={path} fill="#1a1a1a" transform={`rotate(120 ${cx} ${cy})`} />
      <path d={path} fill="#6b9a9a" transform={`rotate(240 ${cx} ${cy})`} />
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
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 12, color: "#8bbfb0" }}>{label}</span>
        <span style={{ fontSize: 12, color: "#7ed957", fontWeight: 600 }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(126,217,87,0.1)", borderRadius: 100, overflow: "hidden" }}>
        <div
          style={{
            height: "100%", borderRadius: 100,
            background: "linear-gradient(90deg,#4caf72,#7ed957)",
            width: active ? `${pct}%` : "0%",
            transition: `width 1.4s cubic-bezier(0.4,0,0.2,1) ${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Floating Badge ─── */
function FloatBadge({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute", borderRadius: 12,
        background: "rgba(10,28,22,0.92)", backdropFilter: "blur(16px)",
        border: "1px solid rgba(126,217,87,0.3)",
        padding: "10px 14px", zIndex: 10,
        display: "flex", alignItems: "center", gap: 10,
        boxShadow: "0 8px 28px rgba(0,0,0,0.4)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  /* Card stats count-ups */
  const rows = useCountUp(2847, 2000);
  const errs = useCountUp(3, 2000);
  const qual = useCountUp(99, 2000, "%");

  /* Feature section reveal */
  const { ref: featRef, inView: featIn } = useInView(0.1);
  const { ref: statsRef, inView: statsIn } = useInView(0.2);

  /* Trigger count-up when card comes into view */
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
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        /* Dot grid drift */
        @keyframes gridDrift {
          0%   { background-position: 0 0; }
          100% { background-position: 28px 28px; }
        }
        .dot-grid {
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background-image: radial-gradient(circle, rgba(126,217,87,0.18) 1px, transparent 1px);
          background-size: 28px 28px;
          animation: gridDrift 30s linear infinite;
        }

        /* Hero text stagger */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .anim-badge { animation: fadeUp .7s .1s both; }
        .anim-h1    { animation: fadeUp .8s .2s both; }
        .anim-p     { animation: fadeUp .7s .38s both; }
        .anim-ctas  { animation: fadeUp .7s .52s both; }
        .anim-trust { animation: fadeUp .7s .66s both; }

        /* Card float */
        @keyframes cardFloat {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-14px) rotate(.4deg); }
        }
        .card-float { animation: cardFloat 6s ease-in-out infinite; }

        /* Floating badges */
        @keyframes floatA { 0%,100%{transform:translate(0,0)rotate(-1deg)} 50%{transform:translate(-6px,-10px)rotate(1deg)} }
        @keyframes floatB { 0%,100%{transform:translate(0,0)rotate(1deg)}  50%{transform:translate(6px,-8px)rotate(-1deg)} }
        @keyframes floatC { 0%,100%{transform:translate(0,0)}              50%{transform:translate(-4px,10px)} }
        .float-a { animation: floatA 7s ease-in-out infinite; }
        .float-b { animation: floatB 8s ease-in-out infinite; }
        .float-c { animation: floatC 6s ease-in-out infinite; }

        /* Orbs */
        @keyframes orbMove1 { 0%,100%{transform:translate(0,0)}   50%{transform:translate(30px,20px)} }
        @keyframes orbMove2 { 0%,100%{transform:translate(0,0)}   50%{transform:translate(-20px,-30px)} }
        .orb-1 { animation: orbMove1 10s ease-in-out infinite; }
        .orb-2 { animation: orbMove2 12s ease-in-out infinite; }

        /* Pulse dot */
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(126,217,87,.5); }
          50%      { box-shadow: 0 0 0 6px rgba(126,217,87,0); }
        }
        .pulse-dot { animation: pulse 2s infinite; }

        /* Border glow */
        @keyframes borderGlow {
          0%,100% { border-color: rgba(126,217,87,0.3); }
          50%      { border-color: rgba(126,217,87,0.75); box-shadow: inset 0 0 24px rgba(126,217,87,0.06); }
        }
        .glow-border { animation: borderGlow 3s ease-in-out infinite; }

        /* Hero card slide in */
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .anim-card { animation: slideInRight .9s .4s both; }

        /* Feature cards */
        @keyframes featureIn {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Hover lift */
        .hover-lift { transition: transform .25s, box-shadow .25s, background .25s, border-color .25s; }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 24px 48px rgba(0,0,0,0.35);
          background: rgba(126,217,87,0.09) !important;
          border-color: #7ed957 !important;
        }

        /* Btn hover */
        .btn-primary-hover { transition: transform .2s, box-shadow .2s; }
        .btn-primary-hover:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(126,217,87,.4); }
        .btn-ghost-hover { transition: background .2s, border-color .2s; }
        .btn-ghost-hover:hover { background: rgba(126,217,87,0.1) !important; border-color: #7ed957 !important; }

        /* Nav link */
        .nav-link { color: #8bbfb0; transition: color .2s; font-size:14px; padding:6px 12px; border-radius:8px; background:transparent; border:none; cursor:pointer; font-family:'DM Sans',sans-serif; }
        .nav-link:hover { color: #c8f5a0; }

        /* Footer link */
        .footer-link { color: #8bbfb0; transition: color .2s; text-decoration: none; font-size:14px; }
        .footer-link:hover { color: #7ed957; }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#1b5e5e", fontFamily: "'DM Sans', sans-serif", position: "relative" }}>
        <div className="dot-grid" />

        {/* Glow orbs */}
        <div className="orb-1" style={{ position:"fixed", width:500, height:500, borderRadius:"50%", background:"rgba(126,217,87,0.1)", filter:"blur(90px)", top:-120, left:-120, pointerEvents:"none", zIndex:0 }} />
        <div className="orb-2" style={{ position:"fixed", width:360, height:360, borderRadius:"50%", background:"rgba(107,154,154,0.1)", filter:"blur(80px)", bottom:80, right:-80, pointerEvents:"none", zIndex:0 }} />

        {/* ── NAV ── */}
        <nav style={{
          position:"sticky", top:0, zIndex:100,
          background:"rgba(27,94,94,0.88)", backdropFilter:"blur(20px)",
          borderBottom:"1px solid rgba(126,217,87,0.2)",
        }}>
          <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 2.5rem", display:"flex", alignItems:"center", justifyContent:"space-between", height:64 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <CleanStreamMark size={34} />
              <div style={{ lineHeight:1.1 }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:13, letterSpacing:".15em", color:"#c8f5a0", textTransform:"uppercase" }}>Clean Stream</div>
                <div style={{ fontSize:10, fontWeight:600, letterSpacing:".08em", color:"#7ed957", textTransform:"uppercase" }}>Tech That Clears The Way</div>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Link href="/dashboard"><button className="nav-link">Features</button></Link>
              <Link href="/auth/login">
                <button className="btn-ghost-hover" style={{ background:"transparent", border:"1px solid rgba(126,217,87,0.2)", color:"#c8f5a0", padding:"6px 16px", borderRadius:8, fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                  Sign in
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="btn-primary-hover" style={{ background:"#7ed957", color:"#0f3d2e", padding:"7px 18px", borderRadius:8, fontSize:13, fontWeight:700, border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
                  Get Started <ArrowRight size={15} />
                </button>
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section style={{ position:"relative", minHeight:"calc(100vh - 64px)", overflow:"hidden", zIndex:1 }}>
          {/* Left glow */}
          <div style={{ position:"absolute", top:0, left:0, width:600, height:500, background:"rgba(126,217,87,0.07)", filter:"blur(90px)", borderRadius:"50%", pointerEvents:"none" }} />

          <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 2.5rem", display:"grid", gridTemplateColumns:"1fr 1fr", alignItems:"center", gap:"4rem", minHeight:"calc(100vh - 64px)" }}>

            {/* Left text */}
            <div style={{ paddingTop:80, paddingBottom:80 }}>
              {/* Badge */}
              <div className="anim-badge" style={{ display:"inline-flex", alignItems:"center", gap:8, border:"1px solid rgba(126,217,87,0.25)", borderRadius:100, padding:"5px 14px 5px 8px", marginBottom:28, background:"rgba(126,217,87,0.07)" }}>
                <div className="pulse-dot" style={{ width:7, height:7, borderRadius:"50%", background:"#7ed957", flexShrink:0 }} />
                <span style={{ fontSize:12, color:"#7ed957", fontWeight:500 }}>Now processing 10M+ rows daily</span>
              </div>

              <h1 className="anim-h1" style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(42px,5.5vw,70px)", fontWeight:800, lineHeight:1.05, color:"#c8f5a0", marginBottom:24 }}>
                Clean, Validate<br />&amp; Upload
                <span style={{ display:"block", color:"#7ed957", marginTop:6 }}>Data at Scale</span>
              </h1>

              <p className="anim-p" style={{ fontSize:17, lineHeight:1.75, color:"#8bbfb0", maxWidth:480, marginBottom:36 }}>
                Clean Stream empowers teams to handle large-scale data uploads with intelligent
                validation, real-time processing, and comprehensive history tracking.
              </p>

              <div className="anim-ctas" style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:40 }}>
                <Link href="/auth/signup">
                  <button className="btn-primary-hover" style={{ height:52, padding:"0 32px", borderRadius:12, fontSize:15, fontWeight:700, background:"#7ed957", color:"#0f3d2e", border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif", display:"flex", alignItems:"center", gap:8 }}>
                    Start Free Trial <ArrowRight size={18} />
                  </button>
                </Link>
                <Link href="/dashboard">
                  <button className="btn-ghost-hover" style={{ height:52, padding:"0 32px", borderRadius:12, fontSize:15, fontWeight:500, background:"transparent", color:"#c8f5a0", border:"1px solid rgba(126,217,87,0.2)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                    View Demo
                  </button>
                </Link>
              </div>

              <div className="anim-trust" style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
                {["500+ teams", "99.9% uptime", "No credit card"].map((item, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", background:"rgba(126,217,87,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="#7ed957" strokeWidth="2" strokeLinecap="round"><path d="M2 6l3 3 5-5"/></svg>
                    </div>
                    <span style={{ fontSize:13, color:"#8bbfb0" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — dashboard card */}
            <div ref={cardRef} className="anim-card" style={{ position:"relative", display:"flex", alignItems:"center", justifyContent:"center", paddingTop:60, paddingBottom:60 }}>

              {/* Floating badges */}
              <FloatBadge style={{ top:"12%", left:"-8%", animation:"floatA 7s ease-in-out infinite" }}>
                <div style={{ width:30, height:30, borderRadius:9, background:"rgba(126,217,87,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7ed957" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12l5 5 9-9"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#c8f5a0", fontFamily:"'Syne',sans-serif" }}>Validation passed</div>
                  <div style={{ fontSize:10, color:"#8bbfb0" }}>2,847 rows clean</div>
                </div>
              </FloatBadge>

              <FloatBadge style={{ bottom:"18%", right:"-10%", animation:"floatB 8s ease-in-out infinite" }}>
                <div style={{ width:30, height:30, borderRadius:9, background:"rgba(126,217,87,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7ed957" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#c8f5a0", fontFamily:"'Syne',sans-serif" }}>Processing speed</div>
                  <div style={{ fontSize:10, color:"#8bbfb0" }}>1.2s avg</div>
                </div>
              </FloatBadge>

              <FloatBadge style={{ top:"58%", left:"-6%", animation:"floatC 6s ease-in-out infinite" }}>
                <div style={{ width:30, height:30, borderRadius:9, background:"rgba(126,217,87,0.15)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <div className="pulse-dot" style={{ width:8, height:8, borderRadius:"50%", background:"#7ed957" }} />
                </div>
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"#c8f5a0", fontFamily:"'Syne',sans-serif" }}>Live pipeline</div>
                  <div style={{ fontSize:10, color:"#8bbfb0" }}>Running</div>
                </div>
              </FloatBadge>

              {/* Dashboard card */}
              <div className="card-float" style={{
                width:"100%", maxWidth:440,
                borderRadius:24, overflow:"hidden",
                border:"1px solid rgba(126,217,87,0.25)",
                background:"rgba(0,0,0,0.32)",
                backdropFilter:"blur(20px)",
                boxShadow:"0 40px 80px rgba(0,0,0,0.45), 0 0 0 1px rgba(126,217,87,0.08), inset 0 1px 0 rgba(126,217,87,0.15)",
              }}>
                {/* Window chrome */}
                <div style={{ background:"rgba(126,217,87,0.07)", borderBottom:"1px solid rgba(126,217,87,0.2)", padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", gap:6 }}>
                    {["#ff6b6b","#ffd93d","#7ed957"].map((c,i) => <div key={i} style={{ width:10, height:10, borderRadius:"50%", background:c }} />)}
                  </div>
                  <span style={{ fontSize:11, color:"#8bbfb0", fontWeight:500, letterSpacing:".04em" }}>cleanstream_upload.csv</span>
                  <div style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#7ed957" }}>
                    <div className="pulse-dot" style={{ width:6, height:6, borderRadius:"50%", background:"#7ed957" }} />
                    Live
                  </div>
                </div>

                {/* Upload drop zone */}
                <div style={{ padding:"24px 22px 18px" }}>
                  <div className="glow-border" style={{ border:"2px dashed rgba(126,217,87,0.3)", borderRadius:14, padding:"28px 20px", textAlign:"center", background:"rgba(126,217,87,0.03)" }}>
                    <div style={{ width:50, height:50, borderRadius:14, margin:"0 auto 14px", background:"rgba(126,217,87,0.12)", border:"1px solid rgba(126,217,87,0.3)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Upload size={22} style={{ color:"#7ed957" }} />
                    </div>
                    <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, color:"#c8f5a0", marginBottom:4 }}>Drop your data file here</div>
                    <div style={{ fontSize:12, color:"#8bbfb0" }}>CSV, XLSX, JSON — up to 500MB</div>
                  </div>
                </div>

                {/* Progress bars */}
                <div style={{ padding:"4px 22px 16px" }}>
                  <ProgressBar label="Data Validation" pct={87} delay={0}   active={cardIn} />
                  <ProgressBar label="Deduplication"   pct={62} delay={200} active={cardIn} />
                  <ProgressBar label="Schema Check"    pct={94} delay={400} active={cardIn} />
                </div>

                {/* Stat boxes */}
                <div style={{ padding:"0 22px 24px", display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                  {[
                    { num: rows.value, label:"Rows Clean" },
                    { num: errs.value, label:"Errors" },
                    { num: qual.value, label:"Quality" },
                  ].map(({ num, label }, i) => (
                    <div key={i} style={{ borderRadius:12, padding:"12px 8px", background:"rgba(126,217,87,0.06)", border:"1px solid rgba(126,217,87,0.18)", textAlign:"center" }}>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:"#7ed957" }}>{num}</div>
                      <div style={{ fontSize:10, color:"#8bbfb0", marginTop:2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radial glow behind card */}
              <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 60% 50%, rgba(126,217,87,0.1) 0%, transparent 70%)", pointerEvents:"none" }} />
            </div>
          </div>

          {/* Bottom fade */}
          <div style={{ position:"absolute", bottom:0, left:0, right:0, height:80, background:"linear-gradient(to top, #1b5e5e, transparent)", pointerEvents:"none" }} />
        </section>

        {/* ── FEATURES ── */}
        <section style={{ position:"relative", zIndex:1, padding:"100px 2.5rem" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(28px,3.5vw,44px)", fontWeight:800, color:"#c8f5a0", marginBottom:10 }}>
                Everything you need to manage data
              </h2>
              <p style={{ fontSize:17, color:"#8bbfb0" }}>Powerful features designed for modern data teams</p>
            </div>

            <div ref={featRef} style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18 }}>
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="hover-lift"
                  style={{
                    borderRadius:20, padding:"26px 24px",
                    background:"rgba(200,245,160,0.04)", border:"1px solid rgba(126,217,87,0.18)",
                    opacity: featIn ? 1 : 0,
                    transform: featIn ? "translateY(0)" : "translateY(32px)",
                    transition: `opacity .6s ${i * 90}ms, transform .6s ${i * 90}ms`,
                  }}
                >
                  <div style={{ width:48, height:48, borderRadius:14, background:"rgba(126,217,87,0.12)", border:"1px solid rgba(126,217,87,0.25)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
                    <feature.icon size={22} style={{ color:"#7ed957" }} />
                  </div>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:"#c8f5a0", marginBottom:8 }}>{feature.title}</h3>
                  <p style={{ fontSize:14, lineHeight:1.65, color:"#8bbfb0" }}>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div style={{ background:"rgba(0,0,0,0.2)", borderTop:"1px solid rgba(126,217,87,0.2)", borderBottom:"1px solid rgba(126,217,87,0.2)", padding:"60px 2.5rem", position:"relative", zIndex:1 }}>
          <div ref={statsRef} style={{ maxWidth:1200, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:24, textAlign:"center" }}>
            {[["10M+","Rows Processed Daily"],["99.9%","Uptime SLA"],["500+","Teams Worldwide"],["< 2s","Avg Processing Time"]].map(([num, label], i) => (
              <div key={i} style={{ opacity: statsIn ? 1 : 0, transform: statsIn ? "translateY(0)" : "translateY(24px)", transition: `opacity .6s ${i * 100}ms, transform .6s ${i * 100}ms` }}>
                <div style={{ fontFamily:"'Syne',sans-serif", fontSize:44, fontWeight:800, color:"#7ed957" }}>{num}</div>
                <div style={{ fontSize:14, color:"#8bbfb0", marginTop:4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── TESTIMONIALS ── */}
        <section style={{ position:"relative", zIndex:1, padding:"100px 2.5rem" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ textAlign:"center", marginBottom:56 }}>
              <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(28px,3.5vw,44px)", fontWeight:800, color:"#c8f5a0", marginBottom:10 }}>
                Trusted by data teams worldwide
              </h2>
              <p style={{ fontSize:17, color:"#8bbfb0" }}>See what our customers have to say</p>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:18 }}>
              {testimonials.map((t, i) => (
                <div key={i} className="hover-lift" style={{ borderRadius:20, padding:"24px", background:"rgba(200,245,160,0.04)", border:"1px solid rgba(126,217,87,0.18)" }}>
                  <div style={{ fontSize:40, fontFamily:"Georgia,serif", color:"#7ed957", lineHeight:1, marginBottom:12 }}>"</div>
                  <p style={{ fontStyle:"italic", lineHeight:1.7, fontSize:14, color:"#8bbfb0", marginBottom:20 }}>{t.quote}</p>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", background:"rgba(126,217,87,0.18)", border:"1px solid rgba(126,217,87,0.35)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#7ed957", flexShrink:0 }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:"#c8f5a0" }}>{t.author}</div>
                      <div style={{ fontSize:11, color:"#8bbfb0" }}>{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{ position:"relative", zIndex:1, padding:"0 2.5rem 100px" }}>
          <div style={{ maxWidth:1200, margin:"0 auto" }}>
            <div style={{ borderRadius:28, padding:"72px 40px", textAlign:"center", position:"relative", overflow:"hidden", background:"rgba(126,217,87,0.07)", border:"1px solid rgba(126,217,87,0.2)" }}>
              <div style={{ position:"absolute", top:0, left:"50%", transform:"translateX(-50%)", width:500, height:160, background:"rgba(126,217,87,0.1)", filter:"blur(64px)", borderRadius:"50%", pointerEvents:"none" }} />
              <div style={{ position:"relative", display:"flex", flexDirection:"column", alignItems:"center" }}>
                <CleanStreamMark size={52} />
                <div style={{ marginTop:16, marginBottom:8, fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:12, letterSpacing:".18em", color:"#c8f5a0", textTransform:"uppercase" }}>Clean Stream</div>
                <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:"clamp(28px,3.5vw,42px)", fontWeight:800, color:"#c8f5a0", marginBottom:16, marginTop:16 }}>Ready to clean your data?</h2>
                <p style={{ fontSize:17, color:"#8bbfb0", maxWidth:500, marginBottom:36, lineHeight:1.7 }}>
                  Join 500+ teams who trust Clean Stream to power their data pipelines. Start free, no credit card required.
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
                  <Link href="/auth/signup">
                    <button className="btn-primary-hover" style={{ height:52, padding:"0 36px", borderRadius:12, fontSize:15, fontWeight:700, background:"#7ed957", color:"#0f3d2e", border:"none", cursor:"pointer", fontFamily:"'Syne',sans-serif", display:"flex", alignItems:"center", gap:8 }}>
                      Start Free Trial <ArrowRight size={18} />
                    </button>
                  </Link>
                  <Link href="/auth/login">
                    <button className="btn-ghost-hover" style={{ height:52, padding:"0 36px", borderRadius:12, fontSize:15, fontWeight:500, background:"transparent", color:"#c8f5a0", border:"1px solid rgba(126,217,87,0.2)", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                      Sign In
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop:"1px solid rgba(126,217,87,0.2)", background:"rgba(0,0,0,0.22)", position:"relative", zIndex:1 }}>
          <div style={{ maxWidth:1200, margin:"0 auto", padding:"56px 2.5rem" }}>
            <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr 1fr", gap:32, marginBottom:40 }}>
              <div>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:12 }}>
                  <CleanStreamMark size={28} />
                  <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:800, fontSize:12, color:"#c8f5a0", letterSpacing:".15em", textTransform:"uppercase" }}>Clean Stream</span>
                </div>
                <p style={{ fontSize:13, lineHeight:1.7, color:"#8bbfb0" }}>Tech That Clears The Way.<br />Enterprise-grade data cleaning for modern teams.</p>
              </div>
              {footerLinks.map(col => (
                <div key={col.heading}>
                  <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:".12em", color:"#c8f5a0", marginBottom:16 }}>{col.heading}</h3>
                  <ul style={{ listStyle:"none", padding:0, display:"flex", flexDirection:"column", gap:8 }}>
                    {col.links.map(link => (
                      <li key={link}><Link href="/dashboard" className="footer-link">{link}</Link></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div style={{ paddingTop:24, borderTop:"1px solid rgba(126,217,87,0.15)", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <CleanStreamMark size={22} />
                <span style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, color:"#c8f5a0" }}>Clean Stream</span>
              </div>
              <p style={{ fontSize:12, color:"#8bbfb0" }}>© 2025 Clean Stream. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}