import React, { useEffect, useState } from "react";
import Navbar from "../navbar";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Typography, Button, IconButton, Avatar, alpha,
  CircularProgress, Alert, Snackbar, Chip, TextField,
} from "@mui/material";

// Icons
import ArrowBackIcon         from "@mui/icons-material/ArrowBack";
import ReportProblemIcon     from "@mui/icons-material/ReportProblem";
import CloseIcon             from "@mui/icons-material/Close";
import AccessTimeIcon        from "@mui/icons-material/AccessTime";
import CheckCircleIcon       from "@mui/icons-material/CheckCircle";
import PlayArrowIcon         from "@mui/icons-material/PlayArrow";
import LockIcon              from "@mui/icons-material/Lock";
import AttachFileIcon        from "@mui/icons-material/AttachFile";
import ExpandMoreIcon        from "@mui/icons-material/ExpandMore";
import ExpandLessIcon        from "@mui/icons-material/ExpandLess";
import PriorityHighIcon      from "@mui/icons-material/PriorityHigh";

import {
  getAssignedIncidents,
  startWorkAPI,
  resolveIncidentAPI,
  closeIncidentAPI,
} from "../../services/apiServices";

// ─── Typography Scale ────────────────────────────────────────────────────────
// 32px → Page Title
// 20px → Section Title
// 16px → Normal Text
// 14px → Secondary Text
// 12px → Small Text

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      })
    : "N/A";

const getFullUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `https://incidentiq-backend.onrender.com/api/${path.replace(/^\//, "")}`;
};

const capitalize = (s) =>
  s ? s.replace(/_|-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

// ─── Status / Priority helpers ────────────────────────────────────────────────
const statusStyle = (status) => {
  const map = {
    open:        { bg: "#fef3c7", color: "#92400e" },
    assigned:    { bg: "#e0f2fe", color: "#0369a1" },
    in_progress: { bg: "#fff7ed", color: "#c2410c", borderColor: "#fb923c" },
    resolved:    { bg: "#dcfce7", color: "#166534" },
    closed:      { bg: "#f3f4f6", color: "#374151" },
  };
  return map[status?.toLowerCase()] || map.open;
};

const priorityStyle = (priority) => {
  const map = {
    critical: { bg: "#fff5f5", color: "#e53e3e" },
    high:     { bg: "#fffbeb", color: "#d97706" },
    medium:   { bg: "#fefce8", color: "#b45309" },
    low:      { bg: "#ecfdf5", color: "#059669" },
  };
  return map[priority?.toLowerCase()] || map.medium;
};

const slaInfo = (createdAt, priority) => {
  const slaMap = { critical: 4, high: 8, medium: 24, low: 48 };
  const hrs = (Date.now() - new Date(createdAt)) / 3_600_000;
  const limit = slaMap[priority?.toLowerCase()] || 24;
  if (hrs > limit)       return { label: `Breached +${Math.round(hrs - limit)}h`, bg: "#fff5f5", color: "#e53e3e" };
  if (hrs > limit * 0.8) return { label: "At Risk",   bg: "#fffbeb", color: "#d97706" };
  return                        { label: "On Track",  bg: "#ecfdf5", color: "#059669" };
};

// ─── Reusable section box ─────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", bgcolor: "#f9fafb" }}>
    {title && (
      // Secondary Text → 14px for section label
      <Typography fontWeight={600} fontSize={14} mb={1}>{title}</Typography>
    )}
    {children}
  </Box>
);

// ─── Collapsible Timeline ─────────────────────────────────────────────────────
const Timeline = ({ updates }) => {
  const [open, setOpen] = useState(false);
  return (
    <Box sx={{ border: "1px solid #e5e7eb", borderRadius: 2, overflow: "hidden" }}>
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          px: 2, py: 1.2, bgcolor: "#f9fafb", cursor: "pointer",
          borderBottom: open ? "1px solid #e5e7eb" : "none",
        }}
      >
        {/* Secondary Text → 14px for accordion label */}
        <Typography fontWeight={600} fontSize={14}>Activity Timeline</Typography>
        {open ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
      </Box>
      {open && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 2 }}>
          {updates.map((u, i) => (
            <Box key={i} sx={{
              p: 1.5, borderRadius: 1.5, border: "1px solid #e5e7eb",
              bgcolor: "#ffffff", display: "flex", flexDirection: "column", gap: 0.5,
            }}>
              {/* Normal Text → 16px for update message */}
              <Typography fontSize={14}>{u.message}</Typography>
              {/* Small Text → 12px for meta */}
              <Typography fontSize={12} color="text.secondary">
                {u.user?.name || u.user?.username || "System"} · {fmt(u.created_at)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

const T = {
  cyan:    "#0891b2", cyanL:   "#ecfeff",
  green:   "#0ea472", greenL:  "#ecfdf5",
  amber:   "#d97706", amberL:  "#fffbeb",
  red:     "#e53e3e", redL:    "#fff5f5",
  violet:  "#7c3aed", violetL: "#f5f3ff",
  teal:    "#0d9488", tealL:   "#f0fdfa",
  border:  "#e8edf5", bg:      "#f4f6fb",
  card:    "#ffffff", text:    "#0f1a2e", sub: "#64748b",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const IncidentDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [incident,       setIncident]       = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [resolutionNote, setResolutionNote] = useState("");
  const [alert,          setAlert]          = useState({ open: false, message: "", severity: "success" });

  const fetchIncident = async () => {
    try {
      setLoading(true);
      const res  = await getAssignedIncidents();
      const list = res.data || [];
      const found = list.find((i) => String(i.id) === String(id));
      if (found) setIncident(found);
      else setAlert({ open: true, message: "Incident not found", severity: "error" });
    } catch {
      setAlert({ open: true, message: "Failed to load incident", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncident(); }, [id]);

  const doAction = async (fn, ok, fail) => {
    try {
      setActionLoading(true);
      await fn();
      setAlert({ open: true, message: ok, severity: "success" });
      fetchIncident();
    } catch {
      setAlert({ open: true, message: fail, severity: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = () => doAction(() => startWorkAPI(id), "Work started", "Failed to start work");
  const handleResolve   = () => doAction(() => resolveIncidentAPI(id, { resolution_note: resolutionNote }), "Incident resolved", "Resolve failed");
  const handleClose     = () => doAction(() => closeIncidentAPI(id), "Incident closed", "Close failed");

  // ── Derived ───────────────────────────────────────────────────────────────
  const statusKey  = incident?.status?.toLowerCase().replace(/-/g, "_");
  const canStart   = statusKey === "assigned";
  const canResolve = ["in_progress", "in-progress"].includes(statusKey);
  const canClose   = statusKey === "resolved";

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <Navbar />
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <CircularProgress size={30} />
      </Box>
    </Box>
  );

  if (!incident) return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <Navbar />
      <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "80vh", gap: 2 }}>
        <ReportProblemIcon sx={{ fontSize: 40, color: "#d1d5db" }} />
        {/* Normal Text → 16px */}
        <Typography fontWeight={700} fontSize={16}>Incident not found</Typography>
        <Button onClick={() => navigate("/engineer/assigned-incidents")} variant="outlined"
          sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600, fontSize: 14 }}>
          Back to Incidents
        </Button>
      </Box>
    </Box>
  );

  const sla = slaInfo(incident.created_at, incident.priority);
  const ss  = statusStyle(incident.status);
  const ps  = priorityStyle(incident.priority);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f0f2f5" }}>
      <Box sx={{ position: "fixed", top: -50, right: -50, width: 300, height: 300, borderRadius: "50%", background: alpha(T.cyan, 0.03), zIndex: 0 }} />
      <Box sx={{ position: "fixed", bottom: -70, left: -70, width: 400, height: 400, borderRadius: "50%", background: alpha(T.teal, 0.02), zIndex: 0 }} />
      <Box sx={{ position: "fixed", top: "20%", left: "10%", width: 200, height: 200, background: alpha(T.violet, 0.01), transform: "rotate(45deg)", zIndex: 0 }} />

      <Navbar />

      <Snackbar open={alert.open} autoHideDuration={3500}
        onClose={() => setAlert((a) => ({ ...a, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}>
        <Alert severity={alert.severity} variant="filled" sx={{ borderRadius: 2, fontWeight: 600, fontSize: 14 }}>
          {alert.message}
        </Alert>
      </Snackbar>

      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 700, mx: "auto", mt: "54px" }}>

        {/* ── Card ── */}
        <Box sx={{
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          bgcolor: "#ffffff",
          overflow: "hidden",
        }}>

          {/* ── HEADER ── */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, borderBottom: "1px solid #e5e7eb", p: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar sx={{ bgcolor: "#b91c1c", width: 40, height: 40 }}>
                  <ReportProblemIcon fontSize="small" />
                </Avatar>
                <Box>
                  {/* Normal Text → 16px for incident title */}
                  <Typography fontWeight={600} fontSize={16}>{incident.title}</Typography>
                  {/* Small Text → 12px for ID */}
                  <Typography fontSize={12} color="text.secondary">ID: #{incident.id}</Typography>
                </Box>
              </Box>
              <IconButton onClick={() => navigate("/engineer/assigned-incidents")} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Metadata row — Small Text (12px) for chips */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", ml: 7 }}>
              {/* Secondary Text → 14px for created date */}
              <Typography fontSize={14} color="text.secondary">
                Created: {fmt(incident.created_at)}
              </Typography>

              <Chip label={capitalize(incident.status)} size="small"
                sx={{ height: 22, fontSize: 12, fontWeight: 500, bgcolor: ss.bg, color: ss.color }} />

              <Chip
                icon={<PriorityHighIcon sx={{ fontSize: "12px !important", color: `${ps.color} !important` }} />}
                label={capitalize(incident.priority)} size="small"
                sx={{ height: 22, fontSize: 12, fontWeight: 500, bgcolor: ps.bg, color: ps.color }} />

              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: "12px !important", color: `${sla.color} !important` }} />}
                label={sla.label} size="small"
                sx={{ height: 22, fontSize: 12, fontWeight: 500, bgcolor: sla.bg, color: sla.color }} />
            </Box>
          </Box>

          <Box sx={{ height: 8 }} />

          {/* ── CONTENT ── */}
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>

            {/* Description — Normal Text → 16px */}
            <Typography fontSize={14}>
              <strong>Description:</strong>{" "}
              {incident.description || "No description provided."}
            </Typography>

            {/* Reported By — Normal Text → 16px */}
            <Typography fontSize={14}>
              <strong>Reported By:</strong>{" "}
              {incident.reportedBy?.name || "Support"}
            </Typography>

            {/* Resolution note (if resolved) */}
            {incident.resolution_note && (
              <Section title="Resolution">
                <Typography fontSize={14}>{incident.resolution_note}</Typography>
              </Section>
            )}

            {/* Start Work button */}
            {canStart && (
              <Button variant="contained" disabled={actionLoading}
                startIcon={<PlayArrowIcon />} onClick={handleStartWork}
                sx={{
                  textTransform: "none",
                  // Secondary Text → 14px
                  fontSize: 14, fontWeight: 600,
                  borderRadius: 1, px: 2, height: 36, alignSelf: "flex-start",
                  bgcolor: "#111827", "&:hover": { bgcolor: "#1f2937" },
                }}>
                Start Work
              </Button>
            )}

            {/* Resolve form */}
            {canResolve && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                <TextField
                  label="Resolution Note"
                  multiline
                  rows={3}
                  fullWidth
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  // Secondary Text → 14px for label
                  InputLabelProps={{ sx: { fontSize: 14 } }}
                  // Normal Text → 16px for textarea input
                  inputProps={{ style: { fontSize: 14 } }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5 } }}
                />
                <Button variant="contained" disabled={actionLoading || !resolutionNote.trim()}
                  startIcon={<CheckCircleIcon />} onClick={handleResolve}
                  sx={{
                    textTransform: "none",
                    // Secondary Text → 14px
                    fontSize: 14, fontWeight: 600,
                    borderRadius: 1, px: 2, height: 36, alignSelf: "flex-start",
                    bgcolor: "#111827", "&:hover": { bgcolor: "#1f2937" },
                    "&.Mui-disabled": { opacity: 0.45 },
                  }}>
                  {actionLoading ? "Resolving…" : "Resolve Incident"}
                </Button>
              </Box>
            )}

            {/* Close button */}
            {canClose && (
              <Button variant="outlined" disabled={actionLoading}
                startIcon={<LockIcon />} onClick={handleClose}
                sx={{
                  textTransform: "none",
                  // Secondary Text → 14px
                  fontSize: 14, fontWeight: 600,
                  borderRadius: 1, px: 2, height: 36, alignSelf: "flex-start",
                  borderColor: "#e5e7eb", color: "#374151",
                  "&:hover": { borderColor: "#111827", color: "#111827" },
                }}>
                Close Incident
              </Button>
            )}

            {/* Attachments */}
            {(incident.attachments?.length > 0 || incident.attachment) && (
              <Section title="Attachments">
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {incident.attachments?.map((att, i) => (
                    <Box key={att.id || i} sx={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      p: 1, borderRadius: 1, border: "1px solid #e5e7eb", bgcolor: "#fff",
                    }}>
                      {/* Secondary Text → 14px for attachment link */}
                      <a href={getFullUrl(att.file)} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 14, textDecoration: "underline", color: "#1d4ed8" }}>
                        📎 {att.file_name || att.file?.split("/").pop()}
                      </a>
                      {/* Small Text → 12px for upload date */}
                      <Typography fontSize={12} color="text.secondary">
                        {att.uploaded_at ? new Date(att.uploaded_at).toLocaleDateString() : ""}
                      </Typography>
                    </Box>
                  ))}
                  {!incident.attachments?.length && incident.attachment && (
                    <a href={getFullUrl(incident.attachment)} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 14, textDecoration: "underline", color: "#1d4ed8" }}>
                      📎 {incident.attachment.split("/").pop()}
                    </a>
                  )}
                </Box>
              </Section>
            )}

            {/* Activity Timeline */}
            {incident.updates?.length > 0 && (
              <Timeline updates={incident.updates} />
            )}

          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default IncidentDetail;