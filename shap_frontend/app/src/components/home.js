import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../images/incident.png"; // ← same logo as Navbar.js
import {
  Box, Typography, Button, Container, Grid, Avatar,
  Divider, LinearProgress, Chip,
} from "@mui/material";
import { alpha, createTheme, ThemeProvider } from "@mui/material/styles";
import MemoryIcon from "@mui/icons-material/Memory";
import StorageIcon from "@mui/icons-material/Storage";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LogoBlock from "./LogoBlock";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import CodeIcon from "@mui/icons-material/Code";
import HubIcon from "@mui/icons-material/Hub";
import LayersIcon from "@mui/icons-material/Layers";

// ── Icons (same set used in Register + Dashboard)
import AdminPanelSettingsIcon   from "@mui/icons-material/AdminPanelSettings";
import ArrowForwardIcon         from "@mui/icons-material/ArrowForward";
import CheckCircleIcon          from "@mui/icons-material/CheckCircle";
import SecurityIcon             from "@mui/icons-material/Security";
import BoltIcon                 from "@mui/icons-material/Bolt";
import ForumIcon                from "@mui/icons-material/Forum";
import SpeedIcon                from "@mui/icons-material/Speed";
import EmojiEventsIcon          from "@mui/icons-material/EmojiEvents";
import ManageAccountsIcon       from "@mui/icons-material/ManageAccounts";
import NotificationsActiveIcon  from "@mui/icons-material/NotificationsActive";
import SupportAgentIcon         from "@mui/icons-material/SupportAgent";
import AccessTimeIcon           from "@mui/icons-material/AccessTime";
import WarningAmberIcon         from "@mui/icons-material/WarningAmber";
import StarIcon                 from "@mui/icons-material/Star";
import AssignmentIcon           from "@mui/icons-material/Assignment";
import BarChartIcon             from "@mui/icons-material/BarChart";
import KeyboardArrowRightIcon   from "@mui/icons-material/KeyboardArrowRight";
import TrendingUpIcon           from "@mui/icons-material/TrendingUp";
import GroupsIcon               from "@mui/icons-material/Groups";
import RefreshIcon              from "@mui/icons-material/Refresh";
import BusinessIcon             from "@mui/icons-material/Business";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS — extracted directly from Register.js + Dashboard.js
// ─────────────────────────────────────────────────────────────────────────────
const T = {
  // Backgrounds (from Register bg: #f0f2f5, Dashboard bg: #f0f2f9)
  pageBg:   "#f0f2f9",
  white:    "#ffffff",
  surface:  "#f8f9fa",   // StyledTextField bg in Register
  surfaceAlt: "#f4f6fb", // slightly tinted surface

  // Borders (from Dashboard border: #e8edf5, Register: #e0e0e0)
  border:   "#e8edf5",
  borderMd: "#dde3ef",

  // Text (from Dashboard text: #0f1a2e, sub: #64748b)
  text: "#1a1a1a",
  sub: "#64748b",
  muted:    "#94a3b8",

  // Accent — indigo/violet from Dashboard T tokens
  indigo:   "#6366f1",
  indigoL:  "#eef2ff",
  violet:   "#7c3aed",
  violetL:  "#f5f3ff",

  // Status colors from Dashboard
  green:    "#0ea472",
  greenL:   "#ecfdf5",
  amber:    "#d97706",
  amberL:   "#fffbeb",
  red:      "#e53e3e",
  redL:     "#fff5f5",
  teal:     "#0d9488",
  tealL:    "#f0fdfa",
  cyan:     "#0891b2",
  cyanL:    "#ecfeff",

  // Dark button (from Register RegisterButton: #1a1a1a)
  dark:     "#1a1a1a",
  dark2:    "#111111",

  // Shadows
  cardShadow: "0 1px 4px rgba(15,26,46,0.06)",
  cardShadowHover: "0 6px 24px rgba(15,26,46,0.09)",
};

// ─────────────────────────────────────────────────────────────────────────────
// MUI THEME — matches your app
// ─────────────────────────────────────────────────────────────────────────────
const muiTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: T.indigo },
    background: { default: T.pageBg, paper: T.white },
    text: { primary: T.text, secondary: T.sub },
  },
  typography: { fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
  shape: { borderRadius: 12 },
});

// ─────────────────────────────────────────────────────────────────────────────
// INJECT STYLES
// ─────────────────────────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("hm-styles")) return;
  const s = document.createElement("style");
  s.id = "hm-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');

    @keyframes hm-fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes hm-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes hm-shimmer { 0%{background-position:0% center} 100%{background-position:200% center} }
    @keyframes hm-slide   { from{opacity:0;transform:translateX(16px)} to{opacity:1;transform:translateX(0)} }
    @keyframes hm-pulse   { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.1);opacity:0} }
    @keyframes hm-scan    { 0%{top:-60%} 100%{top:160%} }

    .hm-au  { animation: hm-fadeUp 0.55s cubic-bezier(.16,1,.3,1) forwards; opacity:0; }
    .hm-float { animation: hm-float 6s ease-in-out infinite; }
    .hm-toast { animation: hm-slide .45s ease forwards; opacity:0; }

    .hm-nav-link {
      font-size: 13.5px; font-weight: 500; color: ${T.sub};
      text-decoration: none; transition: color .18s;
      font-family: 'DM Sans', sans-serif;
    }
    .hm-nav-link:hover { color: ${T.text}; }

    .hm-card {
      background: ${T.white};
      border-radius: 16px;
      border: 1px solid ${T.border};
      box-shadow: ${T.cardShadow};
      transition: transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s ease;
    }
    .hm-card:hover {
      transform: translateY(-4px);
      box-shadow: ${T.cardShadowHover};
    }

    .hm-btn-primary {
      transition: filter .18s ease, transform .18s ease, box-shadow .18s ease !important;
    }
    .hm-btn-primary:hover {
      filter: brightness(1.06) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 8px 24px rgba(26,26,26,0.25) !important;
    }
    .hm-btn-outline {
      transition: background .18s, border-color .18s, color .18s !important;
    }
    .hm-btn-outline:hover {
      background: ${T.indigoL} !important;
      border-color: ${T.indigo} !important;
      color: ${T.indigo} !important;
    }

    .hm-live::after {
      content: "";
      position: absolute; inset: -4px; border-radius: 50%;
      border: 1.5px solid ${T.green};
      animation: hm-pulse 2s ease-out infinite;
    }

    .hm-scan-wrap { position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none; }
    .hm-scan { position:absolute;left:0;right:0;height:35%;
      background:linear-gradient(to bottom,transparent,rgba(99,102,241,0.03),transparent);
      animation:hm-scan 5s linear infinite; }

    /* ── Navbar button hover matching Navbar.js NavButton */
    .hm-nav-btn {
      font-size: 13.5px !important;
      font-weight: 500 !important;
      color: ${T.sub} !important;
      text-decoration: none;
      font-family: 'DM Sans', sans-serif;
      padding: 4px 12px;
      border-radius: 8px;
      transition: background .18s, color .18s, transform .15s !important;
      cursor: pointer;
      background: transparent;
      border: none;
    }
    .hm-nav-btn:hover {
      background: rgba(0,0,0,0.04) !important;
      color: ${T.text} !important;
      transform: translateY(-1px) !important;
    }
  `;
  document.head.appendChild(s);
};

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────────────────────────────────────
const Counter = ({ end, suffix = "", duration = 1800 }) => {
  const [v, setV] = useState(0);
  const ref = useRef();
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting || started.current) return;
      started.current = true;
      const t0 = performance.now();
      const frame = (t) => {
        const p = Math.min((t - t0) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setV(Math.floor(ease * end));
        if (p < 1) requestAnimationFrame(frame); else setV(end);
      };
      requestAnimationFrame(frame);
      obs.disconnect();
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{v.toLocaleString()}{suffix}</span>;
};

// ─────────────────────────────────────────────────────────────────────────────
// MINI DASHBOARD PREVIEW — mirrors real Dashboard.js card style
// ─────────────────────────────────────────────────────────────────────────────
const DashPreview = () => (
  <Box className="hm-float" sx={{
    background: T.white,
    borderRadius: "20px",
    border: `1px solid ${T.border}`,
    boxShadow: "0 20px 60px rgba(15,26,46,0.12), 0 4px 16px rgba(15,26,46,0.06)",
    overflow: "hidden",
    width: "100%",
    maxWidth: 460,
    position: "relative",
  }}>
    <div className="hm-scan-wrap"><div className="hm-scan" /></div>

    {/* Window chrome — matches Dashboard header */}
    <Box sx={{
      background: T.pageBg,
      borderBottom: `1px solid ${T.border}`,
      px: 2.5, py: 1.8,
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
        <Box sx={{
          width: 28, height: 28, borderRadius: "9px",
          background: `linear-gradient(135deg, ${T.indigo}, ${T.violet})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 3px 10px ${alpha(T.indigo, 0.35)}`,
        }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 14, color: "#fff" }} />
        </Box>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: T.text, letterSpacing: "-0.2px" }}>
          Admin Dashboard
        </Typography>
        {/* Live indicator */}
        <Box className="hm-live" sx={{
          width: 7, height: 7, borderRadius: "50%",
          bgcolor: T.green, position: "relative",
          boxShadow: `0 0 6px ${T.green}`,
        }} />
      </Box>
      {/* macOS-style dots */}
      <Box sx={{ display: "flex", gap: "5px" }}>
        {["#ff5f57","#febc2e","#28c840"].map(c => (
          <Box key={c} sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: c }} />
        ))}
      </Box>
    </Box>

    <Box sx={{ p: 2 }}>
      {/* 4 Metric cards — match Dashboard MetricCard style */}
      <Grid container spacing={1} sx={{ mb: 1.5 }}>
        {[
          { label: "Total Incidents", val: "2,847", color: T.indigo,  bg: T.indigoL, Icon: ForumIcon,       trend: "+12%" },
          { label: "Resolved",        val: "2,391", color: T.green,   bg: T.greenL,  Icon: CheckCircleIcon, trend: "+8%"  },
          { label: "SLA Breaches",    val: "14",    color: T.red,     bg: T.redL,    Icon: AccessTimeIcon,  trend: "−3%"  },
          { label: "Agents Online",   val: "36/48", color: T.teal,    bg: T.tealL,   Icon: SupportAgentIcon,trend: "Live" },
        ].map(({ label, val, color, bg, Icon, trend }) => (
          <Grid item xs={6} key={label}>
            <Box sx={{
              background: T.white, borderRadius: "10px",
              border: `1px solid ${T.border}`,
              p: "10px 12px", position: "relative", overflow: "hidden",
              "&::before": {
                content: '""', position: "absolute",
                top: 0, left: 0, right: 0, height: "2.5px",
                background: color, borderRadius: "10px 10px 0 0",
              },
            }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                <Typography sx={{ fontSize: 8, color: T.sub, textTransform: "uppercase", letterSpacing: "0.7px", fontWeight: 600 }}>
                  {label}
                </Typography>
                <Box sx={{ width: 15, height: 15, borderRadius: 4, bgcolor: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon sx={{ fontSize: 9, color }} />
                </Box>
              </Box>
              <Typography sx={{ fontSize: 17, fontWeight: 800, color, lineHeight: 1 }}>{val}</Typography>
              <Typography sx={{
                fontSize: 8.5, fontWeight: 700, mt: "2px",
                color: trend.startsWith("+") ? T.green : trend === "Live" ? T.teal : T.red,
              }}>{trend}</Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Bar chart — matches Dashboard AreaChart section */}
      <Box sx={{
        background: T.white, borderRadius: "10px",
        border: `1px solid ${T.border}`, p: "12px", mb: 1.5,
      }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography sx={{ fontSize: 9, color: T.sub, fontWeight: 600 }}>7-Day Incident Activity</Typography>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            {[{ l: "Received", c: T.indigo }, { l: "Resolved", c: T.green }].map(({ l, c }) => (
              <Box key={l} sx={{ display: "flex", alignItems: "center", gap: .5 }}>
                <Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: c }} />
                <Typography sx={{ fontSize: 8, color: T.sub, fontWeight: 500 }}>{l}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: "3px", height: 44 }}>
          {[{ r: 70, s: 54 },{ r: 84, s: 70 },{ r: 60, s: 46 },{ r: 98, s: 82 },{ r: 76, s: 63 },{ r: 100, s: 88 },{ r: 88, s: 74 }].map(({ r, s }, i) => (
            <Box key={i} sx={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "1px" }}>
              <Box sx={{ flex: 1, bgcolor: alpha(T.indigo, 0.35), borderRadius: "2px 2px 0 0", height: `${r * .44}px` }} />
              <Box sx={{ flex: 1, bgcolor: alpha(T.green, 0.5),   borderRadius: "2px 2px 0 0", height: `${s * .44}px` }} />
            </Box>
          ))}
        </Box>
        <Box sx={{ display: "flex", mt: "4px" }}>
          {["S","M","T","W","T","F","S"].map((d, i) => (
            <Typography key={i} sx={{ fontSize: 7.5, color: T.muted, flex: 1, textAlign: "center" }}>{d}</Typography>
          ))}
        </Box>
      </Box>

      {/* Agent leaderboard — matches Dashboard Agent Leaderboard section */}
      <Box sx={{ background: T.white, borderRadius: "10px", border: `1px solid ${T.border}`, p: "12px" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: .8, mb: 1 }}>
          <EmojiEventsIcon sx={{ fontSize: 10, color: T.amber }} />
          <Typography sx={{ fontSize: 9, color: T.sub, fontWeight: 600 }}>Top Agents — This Week</Typography>
        </Box>
        {[
          { n: "Priya S.",  r: 47, p: 94, rc: "#d97706" },
          { n: "Arjun K.",  r: 38, p: 87, rc: T.sub     },
          { n: "Meera R.",  r: 31, p: 82, rc: "#b45309"  },
        ].map(({ n, r, p, rc }, i) => (
          <Box key={n} sx={{ display: "flex", alignItems: "center", gap: "8px", mb: i < 2 ? "8px" : 0 }}>
            <Typography sx={{ fontSize: 9, fontWeight: 800, color: rc, width: 8 }}>{i + 1}</Typography>
            <Box sx={{
              width: 18, height: 18, borderRadius: "50%",
              bgcolor: [T.indigo, T.teal, T.green][i],
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 7, fontWeight: 700, color: "#fff",
            }}>{n[0]}</Box>
            <Typography sx={{ fontSize: 9, fontWeight: 600, color: T.text, flex: 1 }}>{n}</Typography>
            <Typography sx={{ fontSize: 8.5, color: T.green, fontWeight: 700 }}>{r} closed</Typography>
            <Box sx={{ width: 32 }}>
              <LinearProgress variant="determinate" value={p} sx={{
                height: 2.5, borderRadius: 2,
                bgcolor: T.border,
                "& .MuiLinearProgress-bar": { bgcolor: T.green },
              }} />
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
// SLA RING — same as Dashboard SlaRing component
// ─────────────────────────────────────────────────────────────────────────────
const SlaRing = ({ pct, color, label, size = 60 }) => {
  const r = (size - 7) / 2;
  const c = 2 * Math.PI * r;
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: .4 }}>
      <Box sx={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={alpha(color, 0.15)} strokeWidth={5.5} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5.5}
            strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} strokeLinecap="round" />
        </svg>
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ fontSize: 10, fontWeight: 800, color }}>{pct}%</Typography>
        </Box>
      </Box>
      <Typography sx={{ fontSize: 8.5, fontWeight: 600, color: T.sub, textTransform: "capitalize" }}>{label}</Typography>
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION TOAST — light mode version
// ─────────────────────────────────────────────────────────────────────────────
const Toast = ({ type, title, body, delay }) => {
  const map = {
    critical: { color: T.red,   bg: T.redL,   border: alpha(T.red, 0.25),   Icon: WarningAmberIcon       },
    success:  { color: T.green, bg: T.greenL, border: alpha(T.green, 0.25), Icon: CheckCircleIcon        },
    warn:     { color: T.amber, bg: T.amberL, border: alpha(T.amber, 0.3),  Icon: NotificationsActiveIcon },
  };
  const { color, bg, border, Icon } = map[type];
  return (
    <Box className="hm-toast" sx={{
      animationDelay: `${delay}s`,
      background: T.white, borderRadius: "13px",
      border: `1px solid ${border}`,
      px: "14px", py: "10px",
      display: "flex", alignItems: "center", gap: "10px",
      boxShadow: "0 4px 20px rgba(15,26,46,0.1)",
      maxWidth: 290, minWidth: 250,
    }}>
      <Box sx={{
        width: 28, height: 28, borderRadius: "8px", flexShrink: 0,
        bgcolor: bg, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon sx={{ fontSize: 14, color }} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 11, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{title}</Typography>
        <Typography sx={{ fontSize: 10, color: T.sub, lineHeight: 1.4 }}>{body}</Typography>
      </Box>
      <Box sx={{
        width: 7, height: 7, borderRadius: "50%", bgcolor: color, flexShrink: 0,
        position: "relative",
        "&::after": {
          content: '""', position: "absolute", inset: -3, borderRadius: "50%",
          border: `1.5px solid ${color}`, animation: "hm-pulse 2s ease-out infinite",
        },
      }} />
    </Box>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECTION LABEL — matches Dashboard's section head style
// ─────────────────────────────────────────────────────────────────────────────
const SectionLabel = ({ text, color = T.indigo, bg }) => (
  <Box sx={{
    display: "inline-flex", alignItems: "center",
    background: bg || alpha(color, 0.08),
    border: `1px solid ${alpha(color, 0.18)}`,
    borderRadius: "100px", px: "14px", py: "6px", mb: 2.5,
  }}>
    <Typography sx={{ fontSize: 11.5, fontWeight: 700, color, letterSpacing: "0.2px" }}>
      {text}
    </Typography>
  </Box>
);

// ─────────────────────────────────────────────────────────────────────────────
// HOME PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    injectStyles();
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 72;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
  };

  // ── Features — only real platform capabilities
  const features = [
    { Icon: ForumIcon,           color: T.indigo, bg: T.indigoL, title: "Unified Incident Hub",       desc: "Every ticket, escalation, and alert in one workspace. Full context from open to resolved — zero silos, zero dropped issues."              },
    { Icon: SpeedIcon,           color: T.teal,   bg: T.tealL,   title: "Real-Time SLA Monitoring",   desc: "Priority-tiered compliance rings update live. Breach alerts fire before deadlines so your team stays ahead of every SLA."               },
    { Icon: EmojiEventsIcon,     color: T.amber,  bg: T.amberL,  title: "Agent Performance Boards",   desc: "Resolution rates, ticket volume, and speed ranked daily. Build a culture of accountability without micromanagement."                    },
    { Icon: ManageAccountsIcon,  color: T.green,  bg: T.greenL,  title: "Role-Based Access Control",  desc: "Admins see everything. Support agents manage queues. Engineers get assigned incidents with full history. Fine-grained, audit-logged."   },
    { Icon: BarChartIcon,        color: T.violet, bg: T.violetL, title: "Executive Analytics",        desc: "7-day activity charts, status breakdowns, and resolution velocity. Make data-driven decisions from a single dashboard view."            },
    { Icon: NotificationsActiveIcon, color: T.cyan, bg: T.cyanL, title: "Smart Auto-Escalation",      desc: "Auto-escalate by priority threshold, SLA remaining, or inactivity. Every stakeholder is notified at exactly the right moment."         },
  ];

  // ── How it works — 3 steps, matching real user flow from Register → Dashboard
  const steps = [
    {
      n: "01", color: T.indigo, bg: T.indigoL, badge: "Admin role",
      title: "Register as Admin",
      desc: "Create your account and get full administrative access. Configure the team, set SLA priority tiers — Critical, High, Medium, Low — and manage the entire platform from your dashboard.",
    },
    {
      n: "02", color: T.teal, bg: T.tealL, badge: "Role-based",
      title: "Onboard your team",
      desc: "Add support agents to handle incoming incidents and engineers to resolve them. Each role sees only what they need — agents manage queues, engineers get assigned tickets with full context.",
    },
    {
      n: "03", color: T.violet, bg: T.violetL, badge: "Live dashboard",
      title: "Track, resolve & improve",
      desc: "Monitor every incident in real time. Watch SLA compliance rings, review the agent leaderboard, and use the 7-day activity chart to measure your team's performance over time.",
    },
  ];

  // ── Testimonials
  const testimonials = [
    { name: "Incident Lifecycle",  role: "Core feature",             av: "IL", color: T.indigo, stars: 5, quote: "Every incident moves through a clear lifecycle — created by support, assigned to an engineer, updated in real time, and closed with a full audit trail visible to admins."         },
    { name: "SLA Enforcement",     role: "Priority management",      av: "SL", color: T.teal,   stars: 5, quote: "Four priority tiers each carry their own SLA deadline. The dashboard surfaces breaches the moment they happen — so nothing slips through without someone being accountable."        },
    { name: "Admin Analytics",     role: "Dashboard & reporting",    av: "AA", color: T.violet, stars: 5, quote: "Admins get a live view of system health — open vs resolved counts, 7-day trend charts, agent leaderboards, and SLA compliance rings — all without leaving the dashboard."         },
  ];

  return (
    <ThemeProvider theme={muiTheme}>
      <Box sx={{ background: T.pageBg, color: T.text, fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

        {/* ════════════════════════════════════════════ NAVBAR — matches Navbar.js exactly */}
        <Box sx={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
          // Mirror StyledAppBar + StyledToolbar from Navbar.js
          background: scrolled
            ? "rgba(255,255,255,0.95)"
            : "rgba(255,255,255,0.92)",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${scrolled ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.05)"}`,
          boxShadow: scrolled
            ? "0 25px 50px -12px rgba(0,0,0,0.12)"
            : "0 25px 50px -12px rgba(0,0,0,0.06)",
          transition: "all .28s ease",
          // Match StyledToolbar minHeight
          minHeight: "54px",
          display: "flex",
          alignItems: "center",
          px: { xs: "16px", md: "24px" }, // matches Navbar.js StyledToolbar px
          // Decorative pseudo-elements (replicated inline via overflow)
          overflow: "hidden",
        }}>

  {/* Left: Logo — pixel-perfect match to Navbar.js LogoContainer */}
<LogoBlock />

{/* Center: Nav links — styled like Navbar.js NavButton */}
<Box sx={{
  display: { xs: "none", md: "flex" },
  gap: "4px",
  alignItems: "center",
  flex: 1,
}}>
  <Button
    onClick={() => scrollTo("features")}
    sx={{
      color: T.sub,
      fontWeight: 500,
      textTransform: "none",
      borderRadius: "8px",
      padding: "4px 12px",
      fontSize: "14px",
      minHeight: "32px",
      backgroundColor: "transparent",
      transition: "all 0.2s",
      "&:hover": {
        backgroundColor: "rgba(0,0,0,0.04)",
        transform: "translateY(-1px)",
        color: T.text,
      },
    }}
  >
    Features
  </Button>
  
  <Button
    onClick={() => scrollTo("how-it-works")}
    sx={{
      color: T.sub,
      fontWeight: 500,
      textTransform: "none",
      borderRadius: "8px",
      padding: "4px 12px",
      fontSize: "14px",
      minHeight: "32px",
      backgroundColor: "transparent",
      transition: "all 0.2s",
      "&:hover": {
        backgroundColor: "rgba(0,0,0,0.04)",
        transform: "translateY(-1px)",
        color: T.text,
      },
    }}
  >
    How it works
  </Button>
  
  <Button
    onClick={() => scrollTo("testimonials")}
    sx={{
      color: T.sub,
      fontWeight: 500,
      textTransform: "none",
      borderRadius: "8px",
      padding: "4px 12px",
      fontSize: "14px",
      minHeight: "32px",
      backgroundColor: "transparent",
      transition: "all 0.2s",
      "&:hover": {
        backgroundColor: "rgba(0,0,0,0.04)",
        transform: "translateY(-1px)",
        color: T.text,
      },
    }}
  >
    Testimonials
  </Button>
</Box>

          {/* Right: CTAs */}
          <Box sx={{ display: "flex", gap: "10px", alignItems: "center", ml: "auto" }}>
            <Button
              onClick={() => navigate("/login")}
              className="hm-btn-outline"
              sx={{
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.85rem",
                borderRadius: "8px",        // matches NavButton borderRadius
                padding: "4px 16px",
                minHeight: "32px",
                border: `1.5px solid ${T.border}`,
                color: T.text,
                backgroundColor: "rgba(248,249,250,0.8)",
                "&:hover": {},
              }}
            >
              Sign in
            </Button>
            <Button
              onClick={() => navigate("/register")}
              className="hm-btn-primary"
              sx={{
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.85rem",
                borderRadius: "8px",
                padding: "4px 16px",
                minHeight: "32px",
                background: T.dark,
                color: "#fff",
                boxShadow: "0 2px 10px rgba(26,26,26,0.22)",
                "&:hover": {},
              }}
            >
              Get started free
            </Button>
          </Box>
        </Box>

        {/* ════════════════════════════════════════════ HERO */}
        <Box sx={{
          position: "relative", pt: "4px",
          minHeight: "100vh", display: "flex", alignItems: "center",
          overflow: "hidden",
        }}>

          {/* Subtle grid pattern */}
          <Box sx={{
            position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
            backgroundImage: `
              linear-gradient(${alpha(T.indigo, 0.05)} 1px, transparent 1px),
              linear-gradient(90deg, ${alpha(T.indigo, 0.05)} 1px, transparent 1px)
            `,
            backgroundSize: "52px 52px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 25%, transparent 75%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 25%, transparent 75%)",
          }} />

          {/* Soft radial glow */}
          <Box sx={{
            position: "absolute", top: "30%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 800, height: 500, pointerEvents: "none", zIndex: 0,
            background: `radial-gradient(ellipse, ${alpha(T.indigo, 0.07)} 0%, ${alpha(T.violet, 0.03)} 50%, transparent 75%)`,
          }} />

<Container maxWidth="xl" sx={{ 
  position: "relative", 
  zIndex: 1, 
  py: { xs: 12, lg: 16 },        // REDUCED FROM 10/14 TO 6/8
  mt: { xs: -2, md: -4 },      // ADDED NEGATIVE MARGIN TOP
}}>
            <Grid container spacing={{ xs: 6, lg: 10 }} alignItems="center">

              {/* ── LEFT: Hero copy */}
              <Grid item xs={12} lg={6}>

                {/* Status pill */}
                <Box className="hm-au" sx={{ animationDelay: "0s" }}>
                  <Box sx={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: T.white,
                    border: `1px solid ${T.border}`,
                    borderRadius: "100px", px: "14px", py: "7px", mb: 3.5,
                    boxShadow: T.cardShadow,
                  }}>
                    <Box className="hm-live" sx={{
                      width: 7, height: 7, borderRadius: "50%",
                      bgcolor: T.green, position: "relative",
                    }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: T.sub }}>
                      Built for internal support & engineering teams
                    </Typography>
                  </Box>
                </Box>

                {/* H1 */}
                <Box className="hm-au" sx={{ animationDelay: "0.08s" }}>
                  <Typography sx={{
                    fontSize: { xs: "1.8rem", md: "2.2rem", lg: "3.4rem" },
                    fontWeight: 900, letterSpacing: "-2px", lineHeight: 1.1,
                    color: T.text, mb: .5,
                  }}>
                    Incident management
                  </Typography>
                  <Typography sx={{
                    fontSize: { xs: "1.4rem", md: "1.8rem", lg: "2.9rem" },
                    fontWeight: 900, letterSpacing: "-2px", lineHeight: 1.1, mb: 3,
                    background: `linear-gradient(100deg, ${T.indigo} 0%, ${T.violet} 60%)`,
                    backgroundSize: "200% auto",
                    animation: "hm-shimmer 5s linear infinite",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    for your team.
                  </Typography>
                </Box>

                {/* Subtitle */}
                <Box className="hm-au" sx={{ animationDelay: "0.16s" }}>
                  <Typography sx={{
                    fontSize: { xs: "1rem", md: "1.00rem" },
                    color: T.sub, lineHeight: 1.85, mb: 4.5, maxWidth: 510, fontWeight: 400,
                  }}>
                    Real-time SLA monitoring, role-based access for admins, support agents and engineers,
                    and a live analytics dashboard — all in one internal tool built to keep your team on top of every incident.
                  </Typography>
                </Box>

{/* CTA buttons */}
<Box
  className="hm-au"
  sx={{
    animationDelay: "0.24s",
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    mb: 3.5
  }}
>
  <Button
    onClick={() => navigate("/register")}
    className="hm-btn-primary"
    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
    sx={{
      textTransform: "none",
      fontWeight: 600,
      fontSize: 13.5,
      borderRadius: "10px",
      px: "22px",   // reduced
      py: "8px",    // reduced
      background: T.dark,
      color: "#fff",
      boxShadow: "0 3px 14px rgba(26,26,26,0.18)",
      transition: "all .2s ease",
      "&:hover": {
        boxShadow: "0 6px 20px rgba(26,26,26,0.25)",
        transform: "translateY(-1px)"
      },
    }}
  >
    Register as Admin
  </Button>

  <Button
    onClick={() => navigate("/login")}
    className="hm-btn-outline"
    endIcon={<KeyboardArrowRightIcon sx={{ fontSize: 14 }} />}
    sx={{
      textTransform: "none",
      fontWeight: 600,
      fontSize: 13.5,
      borderRadius: "10px",
      px: "18px",
      py: "8px",
      border: `1.3px solid ${T.border}`,
      color: T.text,
      background: T.white,
      transition: "all .2s ease",
      "&:hover": {
        background: "#fafafa"
      },
    }}
  >
    View dashboard
  </Button>
</Box>

                {/* Trust icons */}
                <Box className="hm-au" sx={{ animationDelay: "0.32s", display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  {[
                    { Icon: CheckCircleIcon, label: "3 roles — Admin, Support, Engineer", color: T.green  },
                    { Icon: SecurityIcon,    label: "Role-based access control",          color: T.teal   },
                    { Icon: BoltIcon,        label: "Live SLA & analytics dashboard",     color: T.amber  },
                  ].map(({ Icon, label, color }) => (
                    <Box key={label} sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icon sx={{ fontSize: 13, color }} />
                      <Typography sx={{ fontSize: 12.5, color: T.sub, fontWeight: 500 }}>{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Grid>

              {/* ── RIGHT: Dashboard preview + toasts + SLA card */}
              <Grid item xs={12} lg={6}>
                <Box sx={{ position: "relative", display: "flex", justifyContent: { xs: "center", lg: "flex-end" } }}>
                  <Box sx={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%,-50%)",
                    width: "80%", height: "65%", pointerEvents: "none",
                    background: `radial-gradient(ellipse, ${alpha(T.indigo, 0.1)} 0%, transparent 70%)`,
                    filter: "blur(32px)",
                  }} />

                  <Box sx={{ width: "100%", maxWidth: 460, position: "relative", zIndex: 1 }}>
                    <DashPreview />

                    {/* Floating toast notifications */}
                    <Box sx={{
                      position: "absolute",
                      right: { xs: -4, xl: -16 },
                      top: 24,
                      display: "flex", flexDirection: "column", gap: "10px", zIndex: 10,
                    }}>
                      <Toast type="critical" title="SLA Breach — Critical"       body="#INC-1847 · 2h 18m overdue"              delay={0.8} />
                      <Toast type="success"  title="Incident Resolved"           body="#INC-1842 closed by Priya S. · 1h 37m"   delay={1.2} />
                      <Toast type="warn"     title="SLA Warning — High"          body="#INC-1851 · 6h 22m of 8h limit used"     delay={1.6} />
                    </Box>

                    {/* SLA rings floating card */}
                    <Box sx={{
                      position: "absolute",
                      bottom: -20, left: { xs: 0, md: -20 },
                      background: T.white,
                      border: `1px solid ${T.border}`,
                      borderRadius: "16px",
                      p: "14px 20px",
                      display: "flex", gap: "20px", alignItems: "center",
                      boxShadow: "0 8px 32px rgba(15,26,46,0.1)",
                      zIndex: 10,
                      animation: "hm-float 8s ease-in-out infinite",
                      animationDelay: "1.2s",
                    }}>
                      <Box>
                        <Typography sx={{ fontSize: 9, color: T.sub, textTransform: "uppercase", letterSpacing: "0.7px", fontWeight: 700, mb: .4 }}>
                          SLA Health
                        </Typography>
                        <Typography sx={{ fontSize: 9, color: T.muted }}>Active incidents</Typography>
                      </Box>
                      <Box sx={{ display: "flex", gap: "14px" }}>
                        <SlaRing pct={96} color={T.green}  label="Critical" />
                        <SlaRing pct={82} color={T.amber}  label="High"     />
                        <SlaRing pct={74} color={T.red}    label="Medium"   />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>

          {/* Bottom fade */}
          <Box sx={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 80,
            background: `linear-gradient(to top, ${T.pageBg}, transparent)`,
            pointerEvents: "none", zIndex: 2,
          }} />
        </Box>

<Box
  sx={{
    background: T.white,
    borderTop: `1px solid ${T.border}`,
    borderBottom: `1px solid ${T.border}`,
    py: 3.5,
  }}
>
<Container
  maxWidth={false}
  disableGutters
  sx={{ px: { xs: 2, md: 4 } }}
>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: { xs: 3, md: 5 },
        flexWrap: "wrap",
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          color: T.text,
          fontWeight: 600,
          letterSpacing: "0.6px",
          textTransform: "uppercase",
          opacity: 0.75,
        }}
      >
        Built with
      </Typography>

      {[
        { name: "React", icon: <MemoryIcon sx={{ fontSize: 18, color: T.indigo }} /> },
        { name: "Node.js", icon: <HubIcon sx={{ fontSize: 18, color: T.indigo }} /> },
        { name: "Express", icon: <CodeIcon sx={{ fontSize: 18, color: T.indigo }} /> },
        { name: "MongoDB", icon: <StorageIcon sx={{ fontSize: 18, color: T.indigo }} /> },
        { name: "Material UI", icon: <LayersIcon sx={{ fontSize: 18, color: T.indigo }} /> },
        { name: "JWT Auth", icon: <SecurityIcon sx={{ fontSize: 18, color: T.indigo }} /> },
      ].map(item => (
        <Box
          key={item.name}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            px: 1.2,
            py: 0.6,
            borderRadius: "8px",
            transition: "all .2s ease",
            "&:hover": {
              background: "#f7f7f7",
            },
          }}
        >
          {item.icon}

          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: T.text,
              letterSpacing: "-0.2px",
              opacity: 0.9,
            }}
          >
            {item.name}
          </Typography>
        </Box>
      ))}
    </Box>
  </Container>
</Box>
        {/* ════════════════════════════════════════════ STATS */}
<Box sx={{ py: { xs: 6, md: 8 }, background: T.pageBg, }}>
        <Container
  maxWidth={false}
  disableGutters
  sx={{ px: { xs: 2, md: 4 } }}
>
            <Box sx={{ textAlign: "center", mb: 6 }}>
              <SectionLabel text="What's inside" />
              <Typography sx={{ fontSize: { xs: "1.2rem", md: "2.4rem" }, fontWeight: 800, letterSpacing: "-1px", color: T.text, lineHeight: 1.2 }}>
                A full-stack project built end-to-end
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              {[
                { end: 3,   suffix: " roles",   label: "User roles",          sub: "Admin · Support · Engineer",    color: T.indigo, bg: T.indigoL, Icon: GroupsIcon        },
                { end: 4,   suffix: " levels",  label: "SLA priority tiers",  sub: "Critical · High · Medium · Low", color: T.teal,   bg: T.tealL,   Icon: TrendingUpIcon    },
                { end: 100, suffix: "%",         label: "REST API coverage",   sub: "All features fully wired",       color: T.green,  bg: T.greenL,  Icon: CheckCircleIcon   },
                { end: 7,   suffix: " screens",  label: "Core pages built",    sub: "From auth to analytics",         color: T.amber,  bg: T.amberL,  Icon: BoltIcon          },
              ].map(({ end, suffix, label, sub, color, bg, Icon }) => (
                <Grid item xs={6} md={3} key={label}>
                  <Box className="hm-card" sx={{ p: { xs: "22px", md: "28px" }, textAlign: "center" }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: "12px", bgcolor: bg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      mx: "auto", mb: 2,
                    }}>
                      <Icon sx={{ fontSize: 20, color }} />
                    </Box>
                    <Typography sx={{
                      fontSize: { xs: "2rem", md: "2.6rem" }, fontWeight: 900,
                      color, lineHeight: 1, mb: .5,
                    }}>
                      <Counter end={end} suffix={suffix} />
                    </Typography>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: T.text, mb: .3 }}>{label}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: T.sub }}>{sub}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ════════════════════════════════════════════ FEATURES */}
       <Box id="features" sx={{ py: { xs: 6, md: 8 }, background: T.white }}>
  <Container
  maxWidth={false}
  disableGutters
  sx={{ px: { xs: 2, md: 4 } }}
>
            <Box sx={{ textAlign: "center", mb: 7 }}>
              <SectionLabel text="Platform capabilities" color={T.violet} />
              <Typography sx={{ fontSize: { xs: "1.2rem", md: "2.4rem" }, fontWeight: 800, letterSpacing: "-1px", color: T.text, lineHeight: 1.2, mb: 1.5 }}>
                Everything your team needs in one place
              </Typography>
              <Typography sx={{ fontSize: 15.5, color: T.sub, maxWidth: 450, mx: "auto", lineHeight: 1.8 }}>
                Designed for internal teams — admins, support agents, and engineers each get a purpose-built experience.
              </Typography>
            </Box>

            <Grid container spacing={6.5}>
              {features.map(({ Icon, color, bg, title, desc }) => (
                <Grid item xs={12} sm={6} md={4} key={title}>
                  <Box className="hm-card" sx={{ p: { xs: "14px", md: "18px" }, height: "100%", background: T.white }}>
                    <Box sx={{
                      width: 44, height: 44, borderRadius: "12px", bgcolor: bg,
                      display: "flex", alignItems: "center", justifyContent: "center", mb: 2.5,
                    }}>
                      <Icon sx={{ fontSize: 20, color }} />
                    </Box>
                    <Typography sx={{ fontSize: 15, fontWeight: 700, color: T.text, mb: 1, letterSpacing: "-0.2px" }}>
                      {title}
                    </Typography>
                    <Typography sx={{ fontSize: 13.5, color: T.sub, lineHeight: 1.75 }}>{desc}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ════════════════════════════════════════════ HOW IT WORKS */}
       <Box id="how-it-works" sx={{ py: { xs: 6, md: 8 }, background: T.pageBg }}>
       <Container
  maxWidth={false}
  disableGutters
  sx={{ px: { xs: 2, md: 4 } }}
>
            <Box sx={{ textAlign: "center", mb: 7 }}>
              <SectionLabel text="How it works" color={T.teal} />
              <Typography sx={{ fontSize: { xs: "1.2rem", md: "2.4rem" }, fontWeight: 800, letterSpacing: "-1px", color: T.text, lineHeight: 1.2 }}>
                Up and running in three steps
              </Typography>
            </Box>

            <Grid container spacing={1}>
              {steps.map(({ n, color, bg, badge, title, desc }) => (
                <Grid item xs={12} md={4} key={n}>
                  <Box className="hm-card hm-step-card" sx={{
                    p: { xs: "18px", md: "22px" }, height: "100%",
                    position: "relative", overflow: "hidden",
                    "&::before": {
                      content: '""', position: "absolute",
                      top: 0, left: 0, right: 0, height: "3px",
                      background: color, borderRadius: "16px 16px 0 0",
                    },
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "10px", mb: 3 }}>
                      <Box sx={{
                        width: 42, height: 42, borderRadius: "12px",
                        bgcolor: bg, border: `1.5px solid ${alpha(color, 0.22)}`,
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Typography sx={{ fontSize: 16, fontWeight: 900, color }}>{n}</Typography>
                      </Box>
                      <Box sx={{
                        bgcolor: bg, border: `1px solid ${alpha(color, 0.2)}`,
                        borderRadius: "100px", px: "10px", py: "4px",
                      }}>
                        <Typography sx={{ fontSize: 10.5, fontWeight: 700, color }}>{badge}</Typography>
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: 16.5, fontWeight: 700, color: T.text, mb: 1.5, letterSpacing: "-0.2px" }}>
                      {title}
                    </Typography>
                    <Typography sx={{ fontSize: 13.5, color: T.sub, lineHeight: 1.8 }}>{desc}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ════════════════════════════════════════════ TESTIMONIALS */}
       <Box id="testimonials" sx={{ py: { xs: 6, md: 8 }, background: T.white }}>
       <Container
  maxWidth={false}
  disableGutters
  sx={{ px: { xs: 2, md: 4 } }}
>
            <Box sx={{ textAlign: "center", mb: 7 }}>
              <SectionLabel text="Key features in depth" color={T.amber} />
              <Typography sx={{ fontSize: { xs: "1.2rem", md: "2.1rem" }, fontWeight: 800, letterSpacing: "-1px", color: T.text, lineHeight: 1.2, mb: 1.5 }}>
                How the system works, in detail
              </Typography>
              <Typography sx={{ fontSize: 13.5, color: T.sub, fontWeight: 500 }}>
                Three pillars that make this tool functional for a real internal team
              </Typography>
            </Box>

            <Grid container spacing={2.5}>
              {testimonials.map(({ name, role, av, color, quote }) => (
                <Grid item xs={12} md={4} key={name}>
                  <Box className="hm-card" sx={{
                    p: { xs: "18px", md: "22px" }, height: "100%",
                    display: "flex", flexDirection: "column",
                  }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: "10px", bgcolor: alpha(color, 0.12), display: "flex", alignItems: "center", justifyContent: "center", mb: 2.5 }}>
                      <Avatar sx={{ bgcolor: color, width: 24, height: 24, fontSize: 10, fontWeight: 700 }}>{av}</Avatar>
                    </Box>
                    <Typography sx={{ fontSize: 14.5, color: T.text, lineHeight: 1.78, mb: 3, flex: 1 }}>
                      {quote}
                    </Typography>
                    <Divider sx={{ borderColor: T.border, mb: 2 }} />
                    <Box>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: T.text }}>{name}</Typography>
                      <Typography sx={{ fontSize: 11.5, color: T.sub }}>{role}</Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* ════════════════════════════════════════════ FINAL CTA */}
        <Box sx={{ py: { xs: 4, md: 6 },
          background: T.dark,
          position: "relative", overflow: "hidden",
        }}>
          <Box sx={{
            position: "absolute", inset: 0, pointerEvents: "none",
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }} />
          <Box sx={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%,-50%)",
            width: 600, height: 400, pointerEvents: "none",
            background: `radial-gradient(ellipse, ${alpha(T.indigo, 0.2)} 0%, transparent 70%)`,
          }} />

          <Container maxWidth="md" sx={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <Box sx={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "100px", px: "14px", py: "7px", mb: 3.5,
            }}>
              <Box className="hm-live" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: T.green, position: "relative" }} />
              <Typography sx={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                Internal tool · Built as a full-stack portfolio project
              </Typography>
            </Box>

            <Typography sx={{
              fontSize: { xs: "1.4rem", md: "2.6rem" }, fontWeight: 900,
              color: "#fff", letterSpacing: "-2px", lineHeight: 1.12, mb: 2.5,
            }}>
              Ready to explore the platform?
            </Typography>
            <Typography sx={{
              fontSize: { xs: 15, md: 16.5 }, color: "rgba(255,255,255,0.55)",
              mb: 3.5, lineHeight: 1.85, maxWidth: 480, mx: "auto",
            }}>
              Register as an admin to get full access — set up your team, assign roles, and start managing incidents from day one.
            </Typography>

<Box sx={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap", mb: 3 }}>
  <Button
    onClick={() => navigate("/register")}
    endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
    sx={{
      textTransform: "none",
      fontWeight: 600,
      fontSize: 14,
      borderRadius: "10px",
      px: "22px",   // reduced horizontal padding
      py: "8px",    // reduced vertical padding
      background: "#fff",
      color: T.dark,
      boxShadow: "0 3px 14px rgba(0,0,0,0.18)",
      transition: "all .2s ease",
      "&:hover": {
        background: "#f4f4f4",
        transform: "translateY(-1px)",
        boxShadow: "0 6px 22px rgba(0,0,0,0.25)",
      },
    }}
  >
    Create free account
  </Button>

  <Button
    onClick={() => navigate("/login")}
    sx={{
      textTransform: "none",
      fontWeight: 600,
      fontSize: 14,
      borderRadius: "10px",
      px: "20px",
      py: "8px",
      border: "1px solid rgba(255,255,255,0.25)",
      color: "#fff",
      transition: "all .2s ease",
      "&:hover": {
        background: "rgba(255,255,255,0.07)",
        borderColor: "rgba(255,255,255,0.35)",
      },
    }}
  >
    Sign in to dashboard
  </Button>
</Box>

            <Box sx={{ display: "flex", gap: { xs: 2, md: 4 }, justifyContent: "center", flexWrap: "wrap" }}>
              {["Admin · Support · Engineer roles", "Live SLA & analytics dashboard", "Full REST API — React + Node.js"].map(t => (
                <Box key={t} sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <CheckCircleIcon sx={{ fontSize: 13, color: T.green }} />
                  <Typography sx={{ fontSize: 12.5, color: "rgba(255,255,255,0.45)" }}>{t}</Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>

        {/* ════════════════════════════════════════════ FOOTER */}
        <Box sx={{ background: T.dark2, borderTop: "1px solid rgba(255,255,255,0.06)", py: "18px" }}>
    <Container
  maxWidth={false}
  disableGutters
  sx={{ px: { xs: 2, md: 4 } }}
>
            <Box sx={{
              display: "flex", alignItems: "center",
              justifyContent: "space-between", flexWrap: "wrap", gap: 2,
            }}>
              {/* Logo — matches navbar logo above */}
<LogoBlock
  height={32}
  nameFontSize="18px"
  taglineFontSize="10px"
  nameColor="#ffffff"
  taglineColor="rgba(255,255,255,0.55)"
/>

              {/* Footer links */}


              <Typography sx={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                A portfolio project by Vigneshwari Sakthivel · {new Date().getFullYear()}
              </Typography>
            </Box>
          </Container>
        </Box>

      </Box>
    </ThemeProvider>
  );
}