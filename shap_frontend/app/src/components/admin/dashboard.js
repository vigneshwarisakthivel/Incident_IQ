import React, { useEffect, useState } from "react";
import Navbar from "../navbar";
import { useNavigate } from "react-router-dom";
import {
  Box, Typography, Grid, Button,
  CircularProgress, Alert, Snackbar, alpha, LinearProgress, Divider,
  Avatar,
} from "@mui/material";
import { styled, createTheme, ThemeProvider } from "@mui/material/styles";
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend,
} from "recharts";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AssignmentIcon         from "@mui/icons-material/Assignment";
import CheckCircleIcon        from "@mui/icons-material/CheckCircle";
import AccessTimeIcon         from "@mui/icons-material/AccessTime";
import RefreshIcon            from "@mui/icons-material/Refresh";
import BarChartIcon           from "@mui/icons-material/BarChart";
import PieChartIcon           from "@mui/icons-material/PieChart";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import WarningAmberIcon       from "@mui/icons-material/WarningAmber";
import SpeedIcon              from "@mui/icons-material/Speed";
import EmojiEventsIcon        from "@mui/icons-material/EmojiEvents";
import ForumIcon              from "@mui/icons-material/Forum";
import ErrorOutlineIcon       from "@mui/icons-material/ErrorOutline";
import ManageAccountsIcon     from "@mui/icons-material/ManageAccounts";
import BoltIcon               from "@mui/icons-material/Bolt";
import OpenInNewIcon          from "@mui/icons-material/OpenInNew";
import SupportAgentIcon       from "@mui/icons-material/SupportAgent";
import AssessmentIcon         from "@mui/icons-material/Assessment";

import { getIncidents, getUsers } from "../../services/apiServices";

// ─── Typography Scale ────────────────────────────────────────────────────────
// 32px → Page Title
// 20px → Section Title
// 16px → Normal Text
// 14px → Secondary Text
// 12px → Small Text

// ─── Theme ────────────────────────────────────────────────────────────────────
const theme = createTheme({
  palette: { mode: "light", primary: { main: "#6366f1" } },
  typography: { fontFamily: "'DM Sans', 'Segoe UI', sans-serif" },
});

const T = {
  indigo:  "#6366f1", indigoL: "#eef2ff",
  cyan:    "#0891b2", cyanL:   "#ecfeff",
  green:   "#0ea472", greenL:  "#ecfdf5",
  amber:   "#d97706", amberL:  "#fffbeb",
  red:     "#e53e3e", redL:    "#fff5f5",
  violet:  "#7c3aed", violetL: "#f5f3ff",
  teal:    "#0d9488", tealL:   "#f0fdfa",
  border:  "#e8edf5", bg:      "#f0f2f9",
  card:    "#ffffff", text:    "#0f1a2e", sub: "#64748b",
};

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

const priorityMeta = {
  critical: { dot: T.red,    bg: T.redL,    fg: T.red,    sla: 2  },
  high:     { dot: T.amber,  bg: T.amberL,  fg: T.amber,  sla: 8  },
  medium:   { dot: "#f59e0b", bg: "#fffbeb", fg: "#b45309", sla: 24 },
  low:      { dot: T.green,  bg: T.greenL,  fg: T.green,  sla: 72 },
};

const STATUS_COLORS = [T.indigo, T.amber, T.green];
const AGENT_COLORS  = ["#6366f1","#0891b2","#0ea472","#d97706","#e11d48","#7c3aed"];

// ─── Reusable components ──────────────────────────────────────────────────────
const SectionHead = ({ icon: Icon, iconBg, title, action }) => (
  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5 }}>
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
      <Box sx={{
        width: 34, height: 34, borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: iconBg || T.indigoL,
      }}>
        <Icon sx={{ fontSize: 18, color: iconBg ? "#fff" : T.indigo }} />
      </Box>
      {/* Section Title → 20px */}
      <Typography sx={{ fontWeight: 700, fontSize: 20, color: T.text }}>{title}</Typography>
    </Box>
    {action}
  </Box>
);

const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase();
  const color = ["resolved","closed"].includes(s) ? T.green : s === "open" ? T.indigo : s === "waiting_on_user" ? T.amber : T.sub;
  const bg    = ["resolved","closed"].includes(s) ? T.greenL : s === "open" ? T.indigoL : s === "waiting_on_user" ? T.amberL : "#f8fafc";
  return (
    // Small Text → 12px for status badges
    <Box sx={{ display: "inline-flex", alignItems: "center", px: 1.2, py: 0.35, borderRadius: 20, background: bg, color, fontSize: 12, fontWeight: 700 }}>
      {(status || "Unknown").replace(/_/g, " ")}
    </Box>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ background: T.text, color: "#fff", borderRadius: 10, p: "10px 14px", fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
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

const SlaRing = ({ percent, color, size = 100, stroke = 10, label, sub }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(percent, 100) / 100);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
      <Box sx={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={alpha(color, 0.12)} strokeWidth={stroke} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
        </svg>
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* Normal Text → 16px for ring percentage */}
          <Typography sx={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1 }}>{Math.round(percent)}%</Typography>
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
const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [users,   setUsers]   = useState([]);
  const [alert,   setAlert]   = useState({ open: false, message: "", severity: "success" });

  const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
  const adminName  = storedUser?.name || "Admin";

  // ── Derived stats ──────────────────────────────────────────────────────────
  const totalTickets   = tickets.length;
  const openTickets    = tickets.filter(t => t.status?.toLowerCase() === "open").length;
  const resolvedCount  = tickets.filter(t => ["resolved","closed"].includes(t.status?.toLowerCase())).length;
  const waitingCount   = tickets.filter(t => t.status?.toLowerCase() === "waiting_on_user").length;
  const criticalCount  = tickets.filter(t => t.priority?.toLowerCase() === "critical").length;
  const totalAgents    = users.filter(u => ["support","agent"].includes(u.role?.toLowerCase())).length;
  const totalCustomers = users.filter(u => ["customer","user"].includes(u.role?.toLowerCase())).length;

  const overdueList = tickets.filter(t => {
    const hrs = (Date.now() - new Date(t.created_at)) / 3600000;
    const sla = (priorityMeta[t.priority?.toLowerCase()] || priorityMeta.medium).sla;
    return hrs > sla && !["resolved","closed"].includes(t.status?.toLowerCase());
  });

  const resolvedList   = tickets.filter(t => t.resolved_at);
  const avgTime        = resolvedList.length
    ? resolvedList.reduce((a, t) => a + (new Date(t.resolved_at) - new Date(t.created_at)) / 3600000, 0) / resolvedList.length
    : 0;
  const resolutionRate   = Math.round((resolvedCount / (totalTickets || 1)) * 100);
  const overdueRate      = Math.round((overdueList.length / (totalTickets || 1)) * 100);
  const performanceScore = Math.min(100, Math.round((resolutionRate * 0.5) + ((100 - overdueRate) * 0.3) + 20));

  const statusData = [
    { name: "Open",     value: openTickets },
    { name: "Waiting",  value: waitingCount },
    { name: "Resolved", value: resolvedCount },
  ].filter(d => d.value > 0);

  const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const di = tickets.filter(t => new Date(t.created_at).toDateString() === d.toDateString());
    return {
      day: DAYS[d.getDay()],
      received: di.length,
      resolved: di.filter(t => ["resolved","closed"].includes(t.status?.toLowerCase())).length,
    };
  });

  const slaCompliance = ["critical","high","medium"].map(p => {
    const group = tickets.filter(t => t.priority?.toLowerCase() === p && !["resolved","closed"].includes(t.status?.toLowerCase()));
    if (!group.length) return { label: p, pct: 100, groupSize: 0 };
    const onTime = group.filter(t => (Date.now() - new Date(t.created_at)) / 3600000 <= priorityMeta[p].sla).length;
    return { label: p, pct: Math.round((onTime / group.length) * 100), groupSize: group.length };
  });

  const agentMap = {};
  tickets.forEach((incident) => {
    if (incident.assignedEngineer) {
      const eng = incident.assignedEngineer.name;
      if (!agentMap[eng]) agentMap[eng] = { name: eng, role: "Engineer", total: 0, resolved: 0 };
      agentMap[eng].total++;
      if (incident.resolved_at) agentMap[eng].resolved++;
    }
    const closeUpdate = incident.updates.find(u => u.message.toLowerCase().includes("incident closed"));
    if (closeUpdate) {
      const supportName = closeUpdate.user.name;
      if (!agentMap[supportName]) agentMap[supportName] = { name: supportName, role: "Support", total: 0, resolved: 0 };
      agentMap[supportName].total++;
      agentMap[supportName].resolved++;
    }
  });

  const agentLeaderboard = Object.values(agentMap).sort((a, b) => b.resolved - a.resolved).slice(0, 5);
  const leaderboard = Object.values(agentMap);

  const recentCritical = tickets
    .filter(t => t.priority?.toLowerCase() === "critical" && !["resolved","closed"].includes(t.status?.toLowerCase()))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incRes, userRes] = await Promise.all([
        getIncidents().catch(() => ({ data: [] })),
        getUsers().catch(() => ({ data: [] })),
      ]);
      setTickets(incRes.data?.incidents || incRes.data || []);
      setUsers(userRes.data?.users || userRes.data || []);
    } catch {
      setAlert({ open: true, message: "Failed to load admin data", severity: "error" });
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
  const fmtAgo = dt => {
    const h = (Date.now() - new Date(dt)) / 3600000;
    return h < 1 ? `${Math.round(h * 60)}m ago` : h < 24 ? `${Math.round(h)}h ago` : `${Math.round(h / 24)}d ago`;
  };

  if (loading) return (
    <Box sx={{ minHeight: "100vh", background: T.bg }}>
      <Navbar />
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress sx={{ color: T.indigo }} />
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

        <Box sx={{ px: { xs: 2, md: 4 }, py: 4, maxWidth: 1440, mx: "auto", position: "relative", zIndex: 1, mt: "54px" }}>

          {/* ── Header ── */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 4, flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box sx={{
                width: 46, height: 46, borderRadius: 13,
                background: `linear-gradient(135deg, ${T.indigo} 0%, ${T.violet} 100%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 14px ${alpha(T.indigo, 0.35)}`,
              }}>
                <AdminPanelSettingsIcon sx={{ color: "#fff", fontSize: 24 }} />
              </Box>
              <Box>
                {/* Page Title → 32px */}
                <Typography sx={{ fontSize: 32, fontWeight: 800, color: T.text, lineHeight: 1.2 }}>
                  Admin Dashboard
                </Typography>
                {/* Secondary Text → 14px */}
                <Typography sx={{ fontSize: 14, color: T.sub }}>
                  Welcome back, {adminName} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
              {overdueList.length > 0 && (
                <Box sx={{
                  display: "flex", alignItems: "center", gap: 0.8,
                  background: T.redL, color: T.red, px: 1.8, py: 0.9, borderRadius: 10,
                  // Secondary Text → 14px
                  fontSize: 14, fontWeight: 700,
                  border: `1px solid ${alpha(T.red, 0.2)}`,
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": { "0%,100%": { opacity: 1 }, "50%": { opacity: 0.65 } },
                }}>
                  <WarningAmberIcon sx={{ fontSize: 15 }} />
                  {overdueList.length} SLA Breaches
                </Box>
              )}
              <Button onClick={handleRefresh} variant="outlined" startIcon={<RefreshIcon />}
                sx={{
                  textTransform: "none", borderRadius: 10, fontWeight: 600,
                  borderColor: T.border, color: T.text,
                  // Secondary Text → 14px
                  fontSize: 14,
                  "&:hover": { background: T.indigoL, borderColor: T.indigo },
                }}>
                Refresh
              </Button>
              <Button onClick={() => navigate("/admin/incidents")} variant="contained" endIcon={<KeyboardArrowRightIcon />}
                sx={{
                  textTransform: "none", borderRadius: 10, fontWeight: 700,
                  // Secondary Text → 14px
                  fontSize: 14, px: 2.5,
                  background: `linear-gradient(135deg, ${T.indigo} 0%, ${T.violet} 100%)`,
                  boxShadow: `0 4px 14px ${alpha(T.indigo, 0.3)}`,
                  "&:hover": { boxShadow: `0 6px 20px ${alpha(T.indigo, 0.4)}` },
                }}>
                All Incidents
              </Button>
            </Box>
          </Box>

          {/* ── Metric Cards ── */}
          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            {[
              {
                accent: T.indigo, icon: ForumIcon,
                label: "Total Incidents", value: totalTickets,
                sub: `${openTickets} open · ${resolvedCount} closed`,
                progress: (openTickets / (totalTickets || 1)) * 100, progressColor: T.indigo,
                valueColor: T.indigo,
              },
              {
                accent: T.green, icon: CheckCircleIcon,
                label: "Closed", value: resolvedCount,
                sub: `${resolutionRate}% resolution rate`,
                progress: resolutionRate, progressColor: T.green, valueColor: T.green,
              },
              {
                accent: T.teal, icon: SupportAgentIcon,
                label: "Support Agents", value: totalAgents,
                sub: `${totalCustomers} customers registered`,
                progress: 100, progressColor: T.teal, valueColor: T.teal,
              },
              {
                accent: overdueList.length > 0 ? T.red : T.amber,
                icon: AccessTimeIcon, label: "SLA Breaches", value: overdueList.length,
                sub: `${criticalCount} critical open tickets`,
                progress: overdueRate,
                progressColor: overdueList.length > 0 ? T.red : T.amber,
                valueColor: overdueList.length > 0 ? T.red : T.text,
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
                  <LinearProgress variant="determinate" value={Math.min(100, progress || 0)}
                    sx={{ height: 5, borderRadius: 4, bgcolor: alpha(progressColor, 0.12), "& .MuiLinearProgress-bar": { background: progressColor, borderRadius: 4 } }} />
                </MetricCard>
              </Grid>
            ))}
          </Grid>

          {/* ── Charts Row ── */}
          <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
            <Grid item xs={12} md={8}>
              <Card_>
                <SectionHead icon={BarChartIcon} title="System-wide Incident Activity"
                  action={
                    // Secondary Text → 14px
                    <Typography sx={{ fontSize: 14, color: T.sub }}>Last 7 days</Typography>
                  }
                />
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={weeklyData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.indigo} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={T.indigo} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gRes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={T.green} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={T.green} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={T.border} vertical={false} />
                    {/* Small Text → 12px for axis ticks */}
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: T.sub }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: T.sub }} axisLine={false} tickLine={false} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="received" name="Received" stroke={T.indigo} strokeWidth={2.5} fill="url(#gRec)" dot={{ r: 4, fill: T.indigo, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="resolved"  name="Resolved"  stroke={T.green}  strokeWidth={2.5} fill="url(#gRes)" dot={{ r: 4, fill: T.green,  strokeWidth: 0 }} />
                    {/* Secondary Text → 14px for legend */}
                    <Legend wrapperStyle={{ fontSize: 14, paddingTop: 12 }}
                      formatter={v => <span style={{ color: T.sub, fontWeight: 600 }}>{v}</span>} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card_>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card_ sx={{ height: "85%", display: "flex", flexDirection: "column" }}>
                <SectionHead icon={PieChartIcon} title="Status Breakdown" />
                <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%"
                        innerRadius={58} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                      </Pie>
                      <RechartsTooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Secondary Text → 14px for pie legend */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2, justifyContent: "center" }}>
                    {statusData.map((d, i) => (
                      <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 0.6, fontSize: 14 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[i % STATUS_COLORS.length] }} />
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

            {/* SLA Health */}
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

                {/* SLA deadline reference rows */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                  {[
                    { label: "Critical", sla: "2 hrs",  color: T.red,     bg: T.redL   },
                    { label: "High",     sla: "8 hrs",  color: T.amber,   bg: T.amberL },
                    { label: "Medium",   sla: "24 hrs", color: "#b45309", bg: "#fffbeb" },
                  ].map(({ label, sla, color, bg }) => {
                    const comp       = slaCompliance.find(s => s.label === label.toLowerCase());
                    const active     = comp?.groupSize || 0;
                    const pct        = comp?.pct ?? 100;
                    const statusColor = pct >= 80 ? T.green : pct >= 50 ? T.amber : T.red;
                    const statusText  = active === 0 ? "No active" : pct >= 80 ? "On track" : pct >= 50 ? "At risk" : "Breaching";
                    return (
                      <Box key={label} sx={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        px: 1.5, py: 0.9, borderRadius: 10,
                        background: bg, border: `1px solid ${alpha(color, 0.18)}`,
                      }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: color }} />
                          {/* Small Text → 12px for SLA row label */}
                          <Typography sx={{ fontSize: 12, fontWeight: 700, color }}>{label}</Typography>
                        </Box>
                        <Typography sx={{ fontSize: 12, color, fontWeight: 600, opacity: 0.85 }}>
                          within {sla}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
                          <Typography sx={{ fontSize: 12, color: statusColor, fontWeight: 700 }}>{statusText}</Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>

                <Divider sx={{ borderColor: T.border, mb: 2.5 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  {[
                    { label: "Avg Resolve",  value: fmtDur(avgTime),       color: T.violet },
                    { label: "SLA Breaches", value: overdueList.length,     color: overdueList.length > 0 ? T.red : T.green },
                    { label: "Perf Score",   value: `${performanceScore}%`, color: T.indigo },
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

            {/* Agent Leaderboard */}
            <Grid item xs={12} md={4}>
              <Card_ sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <SectionHead
                  icon={EmojiEventsIcon}
                  title="Agent Performance"
                  iconBg={`linear-gradient(135deg, ${T.indigo}, ${T.violet})`}
                />

                {agentLeaderboard.length > 0 ? (
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Column Headers */}
                    <Box sx={{
                      display: "grid",
                      gridTemplateColumns: "20px 1fr 48px 48px 60px",
                      gap: "0 12px",
                      px: 2, py: 1,
                      borderBottom: `1px solid ${T.border}`,
                      bgcolor: alpha(T.sub, 0.04),
                    }}>
                      {["#", "Agent", "Total", "Open", "Closed"].map((h) => (
                        <Typography key={h} sx={{
                          // Small Text → 12px for column headers
                          fontSize: 12, fontWeight: 700, color: T.sub,
                          textTransform: "uppercase", letterSpacing: 0.8,
                          textAlign: h === "Agent" ? "left" : "center",
                        }}>
                          {h}
                        </Typography>
                      ))}
                    </Box>

                    {/* Agent Rows */}
                    <Box sx={{ flex: 1 }}>
                      {agentLeaderboard.map((agent, i) => {
                        const rate = Math.round((agent.resolved / (agent.total || 1)) * 100);
                        const resolvedColor = rate >= 70 ? T.green : rate >= 40 ? T.amber : T.red;
                        const isLast = i === agentLeaderboard.length - 1;
                        const rankColor = i === 0 ? T.amber : i === 1 ? T.sub : i === 2 ? "#b45309" : alpha(T.sub, 0.4);

                        return (
                          <Box key={agent.name} sx={{
                            display: "grid",
                            gridTemplateColumns: "20px 1fr 48px 48px 60px",
                            gap: "0 12px",
                            alignItems: "center",
                            px: 2, py: 1.25,
                            borderBottom: isLast ? "none" : `1px solid ${T.border}`,
                            transition: "background 0.15s ease",
                            "&:hover": { background: alpha(T.indigo, 0.04) },
                          }}>
                            {/* Rank — Small Text (12px) */}
                            <Typography sx={{ fontSize: 12, fontWeight: 700, textAlign: "center", color: rankColor }}>
                              {i + 1}
                            </Typography>

                            {/* Agent Info */}
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: AGENT_COLORS[i % AGENT_COLORS.length], fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                {(typeof agent.name === "string" ? agent.name : agent.name?.name ?? "U").charAt(0).toUpperCase()}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                {/* Small Text → 12px for agent name */}
                                <Typography sx={{ fontSize: 12, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.4 }}>
                                  {agent.name}
                                </Typography>
                                {/* Small Text → 12px for role */}
                                <Typography sx={{ fontSize: 12, color: T.sub, lineHeight: 1.3 }}>
                                  {agent.role}
                                </Typography>
                                {agent.overdue > 0 && (
                                  <Typography sx={{ fontSize: 12, color: T.red, fontWeight: 600, lineHeight: 1.3 }}>
                                    {agent.overdue} overdue
                                  </Typography>
                                )}
                              </Box>
                            </Box>

                            {/* Total */}
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: T.sub, textAlign: "center" }}>
                              {agent.total}
                            </Typography>

                            {/* Open */}
                            <Typography sx={{ fontSize: 12, fontWeight: 600, color: agent.open > 0 ? T.amber : T.sub, textAlign: "center" }}>
                              {agent.open}
                            </Typography>

                            {/* Resolved + Rate */}
                            <Box sx={{ textAlign: "center" }}>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, color: resolvedColor, lineHeight: 1.3 }}>
                                {agent.resolved}
                              </Typography>
                              <Typography sx={{ fontSize: 12, color: T.sub, fontWeight: 500, lineHeight: 1.2 }}>
                                {rate}%
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 1.5 }}>
                    <SupportAgentIcon sx={{ fontSize: 36, color: T.sub, opacity: 0.25 }} />
                    {/* Secondary Text → 14px for empty state */}
                    <Typography sx={{ fontSize: 14, color: T.sub, fontWeight: 500 }}>
                      No agent data available
                    </Typography>
                  </Box>
                )}
              </Card_>
            </Grid>

            {/* Critical Incidents + Quick Actions */}
            <Grid item xs={12} md={4}>
              <Card_ sx={{ height: "100%", display: "flex", flexDirection: "column" }}>

                <SectionHead icon={ErrorOutlineIcon} title="Critical Incidents"
                  iconBg={`linear-gradient(135deg, ${T.red}, #f87171)`}
                  action={
                    criticalCount > 0 ? (
                      // Small Text → 12px for badge
                      <Box sx={{ background: T.redL, color: T.red, fontSize: 12, fontWeight: 700, px: 1.2, py: 0.4, borderRadius: 20, border: `1px solid ${alpha(T.red, 0.2)}` }}>
                        {criticalCount} open
                      </Box>
                    ) : null
                  }
                />

                {recentCritical.length > 0 ? (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2, mb: 2.5 }}>
                    {recentCritical.map(ticket => (
                      <Box key={ticket.id}
                        onClick={() => navigate(`/admin/incidents/${ticket.id}`)}
                        sx={{
                          display: "flex", alignItems: "center", gap: 1.5,
                          p: "10px 12px", borderRadius: 12,
                          border: `1px solid ${alpha(T.red, 0.15)}`,
                          background: alpha(T.red, 0.025),
                          cursor: "pointer", transition: "all .15s",
                          "&:hover": { background: alpha(T.red, 0.06), borderColor: alpha(T.red, 0.3), transform: "translateX(2px)" },
                        }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, background: T.red }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {/* Secondary Text → 14px for ticket title */}
                          <Typography sx={{ fontSize: 14, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {ticket.title || ticket.subject}
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.4 }}>
                            <StatusBadge status={ticket.status} />
                            {/* Small Text → 12px for time ago */}
                            <Typography sx={{ fontSize: 12, color: T.sub }}>{fmtAgo(ticket.created_at)}</Typography>
                          </Box>
                        </Box>
                        <OpenInNewIcon sx={{ fontSize: 14, color: T.sub, flexShrink: 0 }} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 3, gap: 1, mb: 2 }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: "50%", background: T.greenL, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <CheckCircleIcon sx={{ fontSize: 22, color: T.green }} />
                    </Box>
                    {/* Normal Text → 16px for "No critical incidents" */}
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: T.text }}>No critical incidents</Typography>
                  </Box>
                )}

                <Divider sx={{ borderColor: T.border, mb: 2 }} />

                <SectionHead icon={BoltIcon} title="Quick Actions"
                  iconBg={`linear-gradient(135deg, ${T.indigo}, ${T.violet})`}
                />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {[
                    { label: "Manage Agents",  sub: `${totalAgents} registered`,     icon: ManageAccountsIcon, color: T.teal,   bg: T.tealL,   path: "/admin/user-list" },
                    { label: "All Incidents",  sub: `${totalTickets} total`,          icon: AssignmentIcon,     color: T.indigo, bg: T.indigoL, path: "/admin/incidents" },
                    { label: "SLA Breaches",   sub: `${overdueList.length} breached`, icon: AccessTimeIcon,     color: T.red,    bg: T.redL,    path: "/admin/incidents?filter=overdue" },
                  ].map(({ label, sub, icon: Icon, color, bg, path }) => (
                    <Box key={label} onClick={() => navigate(path)}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.2,
                        p: "9px 10px", borderRadius: 10, border: `1px solid ${T.border}`,
                        cursor: "pointer", transition: "all .15s",
                        "&:hover": { background: alpha(color, 0.04), borderColor: alpha(color, 0.25), transform: "translateX(2px)" },
                      }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon sx={{ fontSize: 16, color }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Secondary Text → 14px for action label */}
                        <Typography sx={{ fontSize: 14, fontWeight: 700, color: T.text }}>{label}</Typography>
                        {/* Small Text → 12px for action sub */}
                        <Typography sx={{ fontSize: 12, color: T.sub }}>{sub}</Typography>
                      </Box>
                      <KeyboardArrowRightIcon sx={{ fontSize: 15, color: T.sub }} />
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ borderColor: T.border, my: 2 }} />

                {/* System Health badge */}
                <Box sx={{
                  display: "flex", alignItems: "center", gap: 1.5, p: 1.8, borderRadius: 12,
                  background: performanceScore >= 80
                    ? `linear-gradient(135deg, ${alpha(T.indigo, 0.07)}, ${alpha(T.teal, 0.04)})`
                    : `linear-gradient(135deg, ${alpha(T.amber, 0.08)}, ${alpha(T.red, 0.04)})`,
                  border: `1px solid ${performanceScore >= 80 ? alpha(T.indigo, 0.2) : alpha(T.amber, 0.2)}`,
                }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: performanceScore >= 80 ? T.indigoL : T.amberL, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <AssessmentIcon sx={{ fontSize: 20, color: performanceScore >= 80 ? T.indigo : T.amber }} />
                  </Box>
                  <Box>
                    {/* Small Text → 12px for "System Health Score" label */}
                    <Typography sx={{ fontSize: 12, fontWeight: 700, color: T.sub, textTransform: "uppercase", letterSpacing: 0.4 }}>
                      System Health Score
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.8 }}>
                      {/* Section Title → 20px for performance number */}
                      <Typography sx={{ fontSize: 20, fontWeight: 800, color: performanceScore >= 80 ? T.indigo : T.amber, lineHeight: 1.2 }}>
                        {performanceScore}%
                      </Typography>
                      {/* Secondary Text → 14px for performance label */}
                      <Typography sx={{ fontSize: 14, fontWeight: 600, color: T.sub }}>
                        {performanceScore >= 80 ? "Healthy 🎯" : performanceScore >= 60 ? "Monitor closely" : "Action needed"}
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

export default Dashboard;