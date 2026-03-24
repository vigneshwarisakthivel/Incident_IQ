import React, { useEffect, useState } from "react";
import Navbar from "../navbar";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, Button, IconButton, Tooltip,
  CircularProgress, Alert, Snackbar, alpha, LinearProgress, Divider,
} from "@mui/material";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";

// Icons
import AssignmentIcon        from "@mui/icons-material/Assignment";
import CheckCircleIcon       from "@mui/icons-material/CheckCircle";
import AccessTimeIcon        from "@mui/icons-material/AccessTime";
import TrendingUpIcon        from "@mui/icons-material/TrendingUp";
import RefreshIcon           from "@mui/icons-material/Refresh";
import EngineeringIcon       from "@mui/icons-material/Engineering";
import BarChartIcon          from "@mui/icons-material/BarChart";
import PieChartIcon          from "@mui/icons-material/PieChart";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import WarningAmberIcon      from "@mui/icons-material/WarningAmber";
import BoltIcon              from "@mui/icons-material/Bolt";
import SpeedIcon             from "@mui/icons-material/Speed";
import OpenInNewIcon         from "@mui/icons-material/OpenInNew";
import EmojiEventsIcon       from "@mui/icons-material/EmojiEvents";

import { getAssignedIncidents } from "../../services/apiServices";

// ─── Typography Scale ────────────────────────────────────────────────────────
// 32px → Page Title
// 20px → Section Title
// 16px → Normal Text
// 14px → Secondary Text
// 12px → Small Text

// ─── Theme ────────────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: { mode: "light", primary: { main: "#1a56db" } },
  typography: { fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
});

const T = {
  blue:    "#1a56db", blueL:   "#eff4ff",
  green:   "#0ea472", greenL:  "#ecfdf5",
  amber:   "#d97706", amberL:  "#fffbeb",
  red:     "#e53e3e", redL:    "#fff5f5",
  violet:  "#7c3aed", violetL: "#f5f3ff",
  cyan:    "#0891b2", cyanL:   "#ecfeff",
  teal:    "#0d9488", tealL:   "#f0fdfa",
  border:  "#e8edf5", bg:      "#f4f6fb",
  card:    "#ffffff", text:    "#0f1a2e", sub: "#64748b",
};

// ─── Styled ───────────────────────────────────────────────────────────────────
const Card_ = styled(Box)(() => ({
  background: T.card, borderRadius: 16,
  border: `1px solid ${T.border}`,
  boxShadow: "0 1px 4px rgba(15,26,46,0.06)",
  padding: 24,
  transition: "box-shadow .2s",
  "&:hover": { boxShadow: "0 6px 24px rgba(15,26,46,0.09)" },
}));

const MetricCard = styled(Box)(({ accent }) => ({
  background: T.card, borderRadius: 16,
  border: `1px solid ${T.border}`,
  padding: "22px 24px",
  position: "relative", overflow: "hidden",
  transition: "transform .2s, box-shadow .2s",
  "&:hover": { transform: "translateY(-3px)", boxShadow: `0 8px 28px ${alpha(accent, 0.15)}` },
  "&::before": {
    content: '""', position: "absolute", top: 0, left: 0,
    width: "100%", height: 3, background: accent,
    borderRadius: "16px 16px 0 0",
  },
}));

// ─── Priority meta ────────────────────────────────────────────────────────────
const priorityMeta = {
  critical: { dot: T.red,    bg: T.redL,    fg: T.red,    sla: 4  },
  high:     { dot: T.amber,  bg: T.amberL,  fg: T.amber,  sla: 8  },
  medium:   { dot: "#f59e0b", bg: "#fffbeb", fg: "#b45309", sla: 24 },
  low:      { dot: T.green,  bg: T.greenL,  fg: T.green,  sla: 48 },
};

// ─── Small reusable components ────────────────────────────────────────────────
const SectionHead = ({ icon: Icon, iconBg, title, action }) => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
      <Box sx={{
        width: 34, height: 34, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: iconBg || T.blueL,
      }}>
        <Icon sx={{ fontSize: 18, color: iconBg ? "#fff" : T.blue }} />
      </Box>
      {/* Section Title → 20px */}
      <Typography sx={{ fontWeight: 700, fontSize: 20, color: T.text }}>{title}</Typography>
    </Box>
    {action}
  </Box>
);

const PriorityBadge = ({ priority }) => {
  const key = priority?.toLowerCase() || "medium";
  const m = priorityMeta[key] || priorityMeta.medium;
  return (
    <Box sx={{
      display: "inline-flex", alignItems: "center", gap: 0.6,
      px: 1.2, py: 0.35, borderRadius: 20,
      // Small Text → 12px for priority badges
      background: m.bg, color: m.fg, fontSize: 12, fontWeight: 700,
    }}>
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: m.dot }} />
      {key.toUpperCase()}
    </Box>
  );
};

const PIE_COLORS = [T.red, T.amber, "#f59e0b", T.blue];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{
      background: T.text, color: "#fff", borderRadius: 10,
      p: "10px 14px", fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    }}>
      {/* Small Text → 12px for tooltip label */}
      {label && <Typography sx={{ fontSize: 12, opacity: 0.6, mb: 0.5 }}>{label}</Typography>}
      {payload.map((p, i) => (
        <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
          <span style={{ fontSize: 14 }}>{p.name}: <strong>{p.value}</strong></span>
        </Box>
      ))}
    </Box>
  );
};

// SVG ring gauge
const SlaRing = ({ percent, color, size = 100, stroke = 10, label, sub }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(percent, 100) / 100);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={alpha(color, 0.12)} strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          {/* Normal Text → 16px for ring percentage */}
          <Typography sx={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1 }}>
            {Math.round(percent)}%
          </Typography>
        </Box>
      </Box>
      {/* Secondary Text → 14px for ring label */}
      <Typography sx={{ fontSize: 14, fontWeight: 700, color: T.text }}>{label}</Typography>
      {/* Small Text → 12px for ring sublabel */}
      <Typography sx={{ fontSize: 12, color: T.sub }}>{sub}</Typography>
    </Box>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const EngineerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading]     = useState(true);
  const [incidents, setIncidents] = useState([]);
  const [alert, setAlert]         = useState({ open: false, message: "", severity: "success" });

  const storedUser   = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
  const engineerName = storedUser?.name || "Engineer";

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalAssigned  = incidents.length;
  const inProgress     = incidents.filter(i => ["assigned","in_progress","in-progress"].includes(i.status?.toLowerCase())).length;
  const resolved       = incidents.filter(i => ["resolved","closed"].includes(i.status?.toLowerCase())).length;
  const criticalCount  = incidents.filter(i => i.priority?.toLowerCase() === "critical").length;

  const overdueList = incidents.filter(i => {
    const hrs = (Date.now() - new Date(i.created_at)) / 3600000;
    const sla = (priorityMeta[i.priority?.toLowerCase()] || priorityMeta.medium).sla;
    return hrs > sla && !["resolved","closed"].includes(i.status?.toLowerCase());
  });

  const resolvedList = incidents.filter(i => i.resolved_at);
  const avgTime = resolvedList.length
    ? resolvedList.reduce((a, i) => a + (new Date(i.resolved_at) - new Date(i.created_at)) / 3600000, 0) / resolvedList.length
    : 0;
  const resolutionRate   = Math.round((resolved / (totalAssigned || 1)) * 100);
  const overdueRate      = Math.round((overdueList.length / (totalAssigned || 1)) * 100);
  const performanceScore = Math.min(100, Math.round((resolutionRate * 0.6) + ((100 - overdueRate) * 0.4)));

  const priorityData = ["critical","high","medium","low"]
    .map(p => ({ name: p.charAt(0).toUpperCase() + p.slice(1), value: incidents.filter(i => i.priority?.toLowerCase() === p).length }))
    .filter(d => d.value > 0);

  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const di = incidents.filter(inc => new Date(inc.created_at).toDateString() === d.toDateString());
    return { day: DAYS[d.getDay()], assigned: di.length, resolved: di.filter(inc => ["resolved","closed"].includes(inc.status?.toLowerCase())).length };
  });

  const slaCompliance = ["critical","high","medium"].map(p => {
    const group = incidents.filter(i => i.priority?.toLowerCase() === p && !["resolved","closed"].includes(i.status?.toLowerCase()));
    if (!group.length) return { label: p, pct: 100, groupSize: 0 };
    const onTime = group.filter(i => (Date.now() - new Date(i.created_at)) / 3600000 <= priorityMeta[p].sla).length;
    return { label: p, pct: Math.round((onTime / group.length) * 100), groupSize: group.length };
  });

  const topOverdue = [...overdueList]
    .sort((a, b) => {
      const ord = { critical: 0, high: 1, medium: 2, low: 3 };
      return (ord[a.priority?.toLowerCase()] ?? 2) - (ord[b.priority?.toLowerCase()] ?? 2);
    })
    .slice(0, 4);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getAssignedIncidents();
      setIncidents(res.data || []);
    } catch {
      setAlert({ open: true, message: "Failed to load dashboard data", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => {
    fetchData();
    setAlert({ open: true, message: "Dashboard refreshed", severity: "success" });
  };

  const fmtDur = h => h < 1 ? `${Math.round(h * 60)}m` : h < 24 ? `${Math.round(h)}h` : `${Math.round(h / 24)}d`;

  if (loading) return (
    <Box sx={{ minHeight: "100vh", background: T.bg }}>
      <Navbar />
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress sx={{ color: T.blue }} />
      </Box>
    </Box>
  );

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: "100vh", background: T.bg }}>
        <Box sx={{ position: "fixed", top: -50, right: -50, width: 300, height: 300, borderRadius: "50%", background: alpha(T.cyan, 0.03), zIndex: 0 }} />
        <Box sx={{ position: "fixed", bottom: -70, left: -70, width: 400, height: 400, borderRadius: "50%", background: alpha(T.teal, 0.02), zIndex: 0 }} />
        <Box sx={{ position: "fixed", top: "20%", left: "10%", width: 200, height: 200, background: alpha(T.violet, 0.01), transform: "rotate(45deg)", zIndex: 0 }} />

        <Navbar />

        <Snackbar open={alert.open} autoHideDuration={3000}
          onClose={() => setAlert(a => ({ ...a, open: false }))}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}>
          <Alert severity={alert.severity} variant="filled" sx={{ borderRadius: 3, fontWeight: 600 }}>
            {alert.message}
          </Alert>
        </Snackbar>

        <Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 1440, mx: "auto", mt: "54px" }}>

          {/* ── Header ── */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 46, height: 46, borderRadius: 13,
                background: `linear-gradient(135deg, ${T.blue} 0%, #4f46e5 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 14px ${alpha(T.blue, 0.35)}`,
              }}>
                <EngineeringIcon sx={{ color: "#fff", fontSize: 24 }} />
              </Box>
              <Box>
 
                <Typography sx={{ fontSize: 32, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>
                  Engineer Dashboard
                </Typography>

                <Typography sx={{ fontSize: 14, color: T.sub }}>
                  Welcome back, {engineerName} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              {overdueList.length > 0 && (
                <Box sx={{
                  display: "flex", alignItems: "center", gap: 0.8,
                  background: T.redL, color: T.red,
                  px: 1.8, py: 0.9, borderRadius: 10,
                  // Secondary Text → 14px
                  fontSize: 14, fontWeight: 700,
                  border: `1px solid ${alpha(T.red, 0.2)}`,
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.65 } },
                }}>
                  <WarningAmberIcon sx={{ fontSize: 15 }} />
                  {overdueList.length} Overdue
                </Box>
              )}
              <Button onClick={handleRefresh} variant="outlined" startIcon={<RefreshIcon />}
                sx={{
                  textTransform: "none", borderRadius: 10, fontWeight: 600,
                  borderColor: T.border, color: T.text,
                  // Secondary Text → 14px
                  fontSize: 14,
                  "&:hover": { background: T.blueL, borderColor: T.blue },
                }}>
                Refresh
              </Button>
              <Button onClick={() => navigate("/engineer/assigned-incidents")}
                variant="contained" endIcon={<KeyboardArrowRightIcon />}
                sx={{
                  textTransform: "none", borderRadius: 10, fontWeight: 700,
                  // Secondary Text → 14px
                  fontSize: 14, px: 2.5,
                  background: `linear-gradient(135deg, ${T.blue} 0%, #4f46e5 100%)`,
                  boxShadow: `0 4px 14px ${alpha(T.blue, 0.3)}`,
                  "&:hover": { boxShadow: `0 6px 20px ${alpha(T.blue, 0.4)}` },
                }}>
                All Incidents
              </Button>
            </Box>
          </Box>

          {/* ── Metric Cards ── */}
          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            {[
              {
                accent: T.blue, icon: AssignmentIcon,
                label: "Total Assigned", value: totalAssigned,
                sub: `${inProgress} currently active`,
                progress: (inProgress / (totalAssigned || 1)) * 100,
                progressColor: T.blue, valueColor: T.blue,
              },
              {
                accent: T.green, icon: CheckCircleIcon,
                label: "Closed", value: resolved,
                sub: `${resolutionRate}% resolution rate`,
                progress: resolutionRate, progressColor: T.green, valueColor: T.green,
              },
              {
                accent: overdueList.length > 0 ? T.red : T.amber,
                icon: AccessTimeIcon, label: "Overdue", value: overdueList.length,
                sub: `${criticalCount} critical open`,
                progress: overdueRate,
                progressColor: overdueList.length > 0 ? T.red : T.amber,
                valueColor: overdueList.length > 0 ? T.red : T.text,
              },
              {
                accent: T.violet, icon: TrendingUpIcon,
                label: "Performance", value: `${performanceScore}%`,
                sub: `Avg resolution: ${fmtDur(avgTime)}`,
                progress: performanceScore, progressColor: T.violet, valueColor: T.violet,
              },
            ].map(({ accent, icon: Icon, label, value, sub, progress, progressColor, valueColor }, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <MetricCard accent={accent}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box>
                      {/* Small Text → 12px for metric label */}
                      <Typography sx={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.6, mb: 0.5 }}>
                        {label}
                      </Typography>
                      {/* Page Title → 32px for big number */}
                      <Typography sx={{ fontSize: 32, fontWeight: 800, color: valueColor || T.text, lineHeight: 1 }}>
                        {value}
                      </Typography>
                    </Box>
                    <Box sx={{ width: 40, height: 40, borderRadius: 11, background: alpha(accent, 0.12), display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon sx={{ fontSize: 20, color: accent }} />
                    </Box>
                  </Box>
                  {/* Secondary Text → 14px for metric sub */}
                  <Typography sx={{ fontSize: 14, color: T.sub, mb: 1.5 }}>{sub}</Typography>
                  <LinearProgress variant="determinate" value={Math.min(100, progress)}
                    sx={{ height: 5, borderRadius: 4, bgcolor: alpha(progressColor, 0.12), "& .MuiLinearProgress-bar": { background: progressColor, borderRadius: 4 } }}
                  />
                </MetricCard>
              </Grid>
            ))}
          </Grid>

          {/* ── Charts Row ── */}
          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            <Grid item xs={12} md={8}>
              <Card_>
                <SectionHead icon={BarChartIcon} title="Weekly Activity"
                  action={
                    // Secondary Text → 14px
                    <Typography sx={{ fontSize: 14, color: T.sub }}>Last 7 days</Typography>
                  }
                />
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={weeklyData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.blue}  stopOpacity={0.15} />
                        <stop offset="95%" stopColor={T.blue}  stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.green} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={T.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                    {/* Small Text → 12px for axis ticks */}
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: T.sub }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: T.sub }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="assigned" name="Assigned" stroke={T.blue} strokeWidth={2.5} fill="url(#gA)" dot={{ r: 4, fill: T.blue, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="resolved" name="Resolved" stroke={T.green} strokeWidth={2.5} fill="url(#gR)" dot={{ r: 4, fill: T.green, strokeWidth: 0 }} />
                    {/* Secondary Text → 14px for legend */}
                    <Legend wrapperStyle={{ fontSize: 14, paddingTop: 12 }}
                      formatter={v => <span style={{ color: T.sub, fontWeight: 600 }}>{v}</span>} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card_>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card_ sx={{ height: "85%", display: "flex", flexDirection: "column" }}>
                <SectionHead icon={PieChartIcon} title="By Priority" />
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={priorityData} cx="50%" cy="50%"
                        innerRadius={58} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {priorityData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Secondary Text → 14px for pie legend items */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2, justifyContent: "center" }}>
                    {priorityData.map((d, i) => (
                      <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.6, fontSize: 14 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span style={{ color: T.sub, fontWeight: 600 }}>{d.name}</span>
                        <span style={{ color: T.text, fontWeight: 800 }}>{d.value}</span>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Card_>
            </Grid>
          </Grid>

          {/* ── Bottom Row ── */}
          <Grid container spacing={2.5}>

            {/* SLA Health rings */}
            <Grid item xs={12} md={4}>
              <Card_ sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <SectionHead icon={SpeedIcon} title="SLA Health"
                  iconBg={`linear-gradient(135deg, ${T.violet}, #a855f7)`}
                  action={
                    // Small Text → 12px for badge
                    <Box sx={{ fontSize: 12, fontWeight: 700, color: T.sub, background: "#f8fafc", px: 1.2, py: 0.4, borderRadius: 20, border: `1px solid ${T.border}` }}>
                      Active only
                    </Box>
                  }
                />
                <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
                  {slaCompliance.map(({ label, pct, groupSize }) => {
                    const color = pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red;
                    const subLabel = groupSize === 0 ? "No active" : pct >= 80 ? "On track" : pct >= 50 ? "At risk" : "Breaching";
                    return <SlaRing key={label} percent={pct} color={color} label={label.charAt(0).toUpperCase() + label.slice(1)} sub={subLabel} />;
                  })}
                </Box>
                <Divider sx={{ borderColor: T.border, mb: 2.5 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between", pt: 2 }}>
                  {[
                    { label: "Avg Resolve",  value: fmtDur(avgTime),       color: T.violet },
                    { label: "SLA Breaches", value: overdueList.length,     color: overdueList.length > 0 ? T.red : T.green },
                    { label: "Perf Score",   value: `${performanceScore}%`, color: T.blue },
                  ].map(({ label, value, color }) => (
                    <Box key={label} sx={{ textAlign: "center" }}>
                      {/* Section Title → 20px for stat value */}
                      <Typography sx={{ fontSize: 20, fontWeight: 800, color }}>{value}</Typography>
                      {/* Small Text → 12px for stat label */}
                      <Typography sx={{ fontSize: 12, color: T.sub, fontWeight: 600 }}>{label}</Typography>
                    </Box>
                  ))}
                </Box>
              </Card_>
            </Grid>

            {/* Needs Attention */}
            <Grid item xs={12} md={4}>
              <Card_ sx={{ height: "100%" }}>
                <SectionHead icon={WarningAmberIcon} title="Needs Attention"
                  iconBg={`linear-gradient(135deg, ${T.red}, #f87171)`}
                  action={
                    overdueList.length > 0 ? (
                      // Small Text → 12px for badge
                      <Box sx={{ background: T.redL, color: T.red, fontSize: 12, fontWeight: 700, px: 1.2, py: 0.4, borderRadius: 20, border: `1px solid ${alpha(T.red, 0.2)}` }}>
                        {overdueList.length} overdue
                      </Box>
                    ) : null
                  }
                />

                {topOverdue.length > 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    {topOverdue.map((inc) => {
                      const hrs = (Date.now() - new Date(inc.created_at)) / 3600000;
                      const sla = (priorityMeta[inc.priority?.toLowerCase()] || priorityMeta.medium).sla;
                      const overBy = Math.round(hrs - sla);
                      return (
                        <Box key={inc.id}
                          onClick={() => navigate(`/engineer/incidents/${inc.id}`)}
                          sx={{
                            display: "flex", alignItems: "flex-start", gap: 1.5,
                            p: 1.5, borderRadius: 12,
                            border: `1px solid ${alpha(T.red, 0.15)}`,
                            background: alpha(T.red, 0.025),
                            cursor: "pointer", transition: "all .15s",
                            "&:hover": { background: alpha(T.red, 0.06), borderColor: alpha(T.red, 0.3), transform: "translateX(2px)" },
                          }}>
                          <Box sx={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, mt: 0.6, background: (priorityMeta[inc.priority?.toLowerCase()] || priorityMeta.medium).dot }} />
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* Secondary Text → 14px for incident title */}
                            <Typography sx={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {inc.title}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                              <PriorityBadge priority={inc.priority} />
                              {/* Small Text → 12px for SLA overdue label */}
                              <Typography sx={{ fontSize: 12, color: T.red, fontWeight: 600 }}>+{overBy}h past SLA</Typography>
                            </Box>
                          </Box>
                          <OpenInNewIcon sx={{ fontSize: 14, color: T.sub, flexShrink: 0, mt: 0.3 }} />
                        </Box>
                      );
                    })}
                    {overdueList.length > 4 && (
                      // Secondary Text → 14px for "view all" link
                      <Typography onClick={() => navigate("/engineer/incidents")}
                        sx={{ fontSize: 14, color: T.blue, fontWeight: 700, cursor: "pointer", textAlign: "center", pt: 0.5, "&:hover": { textDecoration: "underline" } }}>
                        +{overdueList.length - 4} more — View all incidents
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 5, gap: 1.5 }}>
                    <Box sx={{ width: 54, height: 54, borderRadius: "50%", background: T.greenL, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircleIcon sx={{ fontSize: 28, color: T.green }} />
                    </Box>
                    {/* Normal Text → 16px for "All clear!" */}
                    <Typography sx={{ fontSize: 16, fontWeight: 700, color: T.text }}>All clear!</Typography>
                    {/* Secondary Text → 14px for description */}
                    <Typography sx={{ fontSize: 14, color: T.sub, textAlign: "center", lineHeight: 1.6 }}>
                      No incidents are past their SLA deadline.
                    </Typography>
                  </Box>
                )}
              </Card_>
            </Grid>

            {/* Quick Actions */}
            <Grid item xs={12} md={4}>
              <Card_ sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <SectionHead icon={BoltIcon} title="Quick Actions"
                  iconBg={`linear-gradient(135deg, ${T.amber}, #fbbf24)`}
                />

                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: "auto" }}>
                  {[
                    {
                      label: "My Incidents",
                      sub: `${inProgress} active right now`,
                      icon: AssignmentIcon, color: T.blue, bg: T.blueL,
                      path: "/engineer/assigned-incidents",
                    },
                    {
                      label: "Overdue Incidents",
                      sub: overdueList.length > 0 ? `${overdueList.length} need attention` : "All within SLA ✓",
                      icon: AccessTimeIcon,
                      color: overdueList.length > 0 ? T.red : T.green,
                      bg: overdueList.length > 0 ? T.redL : T.greenL,
                      path: "/engineer/incidents?filter=overdue",
                    },
                    {
                      label: "Resolved This Week",
                      sub: `${resolved} total closed`,
                      icon: CheckCircleIcon, color: T.green, bg: T.greenL,
                      path: "/engineer/incidents?filter=resolved",
                    },
                  ].map(({ label, sub, icon: Icon, color, bg, path }) => (
                    <Box key={label} onClick={() => navigate(path)}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.5,
                        p: "13px 14px", borderRadius: 12,
                        border: `1px solid ${T.border}`,
                        cursor: "pointer", transition: "all .15s",
                        "&:hover": { background: alpha(color, 0.04), borderColor: alpha(color, 0.3), transform: "translateX(3px)" },
                      }}>
                      <Box sx={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon sx={{ fontSize: 19, color }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Secondary Text → 14px for action label */}
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: T.text }}>{label}</Typography>
                        {/* Small Text → 12px for action sub */}
                        <Typography sx={{ fontSize: 12, color: T.sub }}>{sub}</Typography>
                      </Box>
                      <KeyboardArrowRightIcon sx={{ fontSize: 16, color: T.sub }} />
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ borderColor: T.border, my: 2.5 }} />

                {/* Performance badge */}
                <Box sx={{
                  display: "flex", alignItems: "center", gap: 2, p: 2, borderRadius: 12,
                  background: performanceScore >= 80
                    ? `linear-gradient(135deg, ${alpha(T.green, 0.07)}, ${alpha(T.blue, 0.04)})`
                    : `linear-gradient(135deg, ${alpha(T.amber, 0.08)}, ${alpha(T.red, 0.04)})`,
                  border: `1px solid ${performanceScore >= 80 ? alpha(T.green, 0.2) : alpha(T.amber, 0.2)}`,
                }}>
                  <Box sx={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: performanceScore >= 80 ? T.greenL : T.amberL, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <EmojiEventsIcon sx={{ fontSize: 22, color: performanceScore >= 80 ? T.green : T.amber }} />
                  </Box>
                  <Box>
                    {/* Small Text → 12px for "Performance Score" label */}
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.4 }}>
                      Performance Score
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                      {/* Section Title → 20px for performance number */}
                      <Typography sx={{ fontSize: 20, fontWeight: 800, color: performanceScore >= 80 ? T.green : T.amber, lineHeight: 1.2 }}>
                        {performanceScore}%
                      </Typography>
                      {/* Secondary Text → 14px for performance label */}
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: T.sub }}>
                        {performanceScore >= 80 ? "Great work 🎯" : performanceScore >= 60 ? "On track" : "Needs focus"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card_>
            </Grid>

          </Grid>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default EngineerDashboard;