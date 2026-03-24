import React, { useEffect, useState } from "react";
import Navbar from "../navbar";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box, Typography, Button, IconButton, Avatar, alpha,
  CircularProgress, Alert, Snackbar, Chip, TextField,
  FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Accordion        from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";

import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CloseIcon         from "@mui/icons-material/Close";
import ExpandMoreIcon    from "@mui/icons-material/ExpandMore";

import {
  getMyIncidents,
  getEngineers,
  assignEngineerAPI,
  resolveIncidentAPI,
  closeIncidentAPI,
  reopenIncidentAPI,
} from "../../services/apiServices";

// ─── Typography Scale ────────────────────────────────────────────────────────
// 32px → Page Title
// 20px → Section Title
// 16px → Normal Text
// 14px → Secondary Text
// 12px → Small Text

// ─── Styled components ────────────────────────────────────────────────────────

const StatusChip = styled(Chip)(({ status }) => {
  const s = {
    open:          { bgcolor: "#fef3c7", color: "#92400e",  borderColor: "#fbbf24" },
    assigned:      { bgcolor: "#e0f2fe", color: "#0369a1",  borderColor: "#38bdf8" },
    "in-progress": { bgcolor: "#dbeafe", color: "#1e40af",  borderColor: "#3b82f6" },
    resolved:      { bgcolor: "#dcfce7", color: "#166534",  borderColor: "#4ade80" },
    closed:        { bgcolor: "#f3f4f6", color: "#374151",  borderColor: "#9ca3af" },
  }[status?.toLowerCase()] || { bgcolor: "#fef3c7", color: "#92400e", borderColor: "#fbbf24" };
  return {
    backgroundColor: s.bgcolor, color: s.color,
    borderColor: s.borderColor, fontWeight: 500,
    // Small Text → 12px for status chips
    fontSize: "12px",
  };
});

const PriorityBadge = styled(Box)(({ priority }) => {
  const s = {
    critical: { bgcolor: "#fef2f2", color: "#b91c1c" },
    high:     { bgcolor: "#fff7ed", color: "#c2410c" },
    medium:   { bgcolor: "#fef9c3", color: "#854d0e" },
    low:      { bgcolor: "#ecfdf5", color: "#065f46" },
  }[priority?.toLowerCase()] || { bgcolor: "#fef9c3", color: "#854d0e" };
  return {
    display: "inline-flex", alignItems: "center", gap: 0.5,
    px: 1.5, py: 0.4, borderRadius: "12px",
    backgroundColor: s.bgcolor, color: s.color,
    // Small Text → 12px for priority badges
    fontSize: "12px", fontWeight: 500,
  };
});

// ─── Constants ────────────────────────────────────────────────────────────────

const T = { cyan: "#0891b2", teal: "#0d9488", violet: "#7c3aed" };
const categories = ["Setup","Troubleshooting","FAQ","Network","Security","Performance","Configuration"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }) : "N/A";

const formatStatus   = (s) => s ? s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
const formatPriority = formatStatus;

const getFullAttachmentUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `https://incidentiq-backend.onrender.com/api/${path.replace(/^\//, "")}`;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const SupIncidentDetail = () => {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [incident,         setIncident]         = useState(null);
  const [loading,          setLoading]          = useState(true);
  const [engineers,        setEngineers]        = useState([]);
  const [selectedEngineer, setSelectedEngineer] = useState("");
  const [resolutionNote,   setResolutionNote]   = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchIncident = async () => {
    try {
      setLoading(true);
      const res  = await getMyIncidents();
      const list = res.data?.incidents || [];
      const found = list.find((i) => String(i.id) === String(id));
      if (found) setIncident(found);
      else setAlert({ open: true, message: "Incident not found", severity: "error" });
    } catch {
      setAlert({ open: true, message: "Failed to load incident", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchEngineers = async () => {
    try {
      const res = await getEngineers();
      setEngineers(res.data);
    } catch { console.error("Failed to fetch engineers"); }
  };

  useEffect(() => {
    fetchIncident();
    fetchEngineers();
    window.scrollTo(0, 0);
  }, [id]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const assignEngineer = async () => {
    try {
      await assignEngineerAPI(id, { engineer_id: selectedEngineer });
      setAlert({ open: true, message: "Engineer assigned successfully", severity: "success" });
      fetchIncident();
      navigate("/support/my-incidents");
    } catch {
      setAlert({ open: true, message: "Failed to assign engineer", severity: "error" });
    }
  };

  const reopenIncident = async () => {
    try {
      await reopenIncidentAPI(id);
      setAlert({ open: true, message: "Incident reopened", severity: "warning" });
      fetchIncident();
      navigate("/support/my-incidents");
    } catch {
      setAlert({ open: true, message: "Failed to reopen incident", severity: "error" });
    }
  };

  const resolveIncident = async () => {
    try {
      await resolveIncidentAPI(id, { resolution_note: resolutionNote, category: selectedCategory });

      const res  = await getMyIncidents();
      const list = res.data?.incidents || [];
      const updated = list.find((i) => String(i.id) === String(id));
      if (updated) setIncident(updated);

      const confirmClose = window.confirm("Resolved successfully. Do you want to close the incident now?");
      if (confirmClose) {
        await closeIncidentAPI(id);
        navigate("/support/my-incidents");
      } else {
        setAlert({ open: true, message: "Incident resolved. You can assign an engineer or close later.", severity: "info" });
        setResolutionNote("");
        setSelectedCategory("");
      }
    } catch {
      setAlert({ open: true, message: "Resolve failed", severity: "error" });
    }
  };

  const closeIncident = async () => {
    try {
      await closeIncidentAPI(id);
      setAlert({ open: true, message: "Incident closed", severity: "success" });
      fetchIncident();
      navigate("/support/my-incidents");
    } catch {
      setAlert({ open: true, message: "Close failed", severity: "error" });
    }
  };

  // ── Loading / not-found ────────────────────────────────────────────────────

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
        {/* Normal Text → 16px for not-found message */}
        <Typography fontWeight={600} fontSize={16}>Incident not found</Typography>
        <Button onClick={() => navigate("/support/my-incidents")} variant="outlined"
          sx={{ textTransform: "none", borderRadius: 2, fontWeight: 600, fontSize: 14 }}>
          Back to Incidents
        </Button>
      </Box>
    </Box>
  );

  // ── Derived flags ──────────────────────────────────────────────────────────

  const incidentStatus   = incident.status?.toLowerCase();
  const incidentPriority = incident.priority?.toLowerCase();
  const hasEngineer      = !!incident.assignedEngineer;

  const isOpen       = incidentStatus === "open";
  const isAssigned   = incidentStatus === "assigned";
  const isInProgress = incidentStatus === "in-progress";
  const isResolved   = incidentStatus === "resolved";

  const isLowMedium    = ["low", "medium"].includes(incidentPriority);
  const isHighCritical = ["high", "critical"].includes(incidentPriority);

  const resolvedByEngineer  = isResolved && hasEngineer;
  const resolvedBySupport   = isResolved && !hasEngineer;
  const isReopenedBySupport = isOpen && !hasEngineer && !!incident.resolution_note;

  // ── Sub-sections ──────────────────────────────────────────────────────────

  const EngineerAssignSection = ({ label = "Assign Engineer", required = false }) => (
    <>
      <FormControl fullWidth size="small">
        {/* Secondary Text → 14px for form label */}
        <InputLabel sx={{ fontSize: 14 }}>{label}</InputLabel>
        <Select
          value={selectedEngineer}
          label={label}
          onChange={(e) => setSelectedEngineer(e.target.value)}
          sx={{ fontSize: 14 }}
        >
          {engineers.map((eng) => (
            // Secondary Text → 14px for menu items
            <MenuItem key={eng.id} value={eng.id} sx={{ fontSize: 14 }}>{eng.name}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <Button
        fullWidth
        variant={required ? "contained" : "outlined"}
        onClick={assignEngineer}
        disabled={!selectedEngineer}
        sx={{
          textTransform: "none",
          // Secondary Text → 14px for button
          fontSize: 14, fontWeight: 600,
          ...(required && { backgroundColor: "#111827", "&:hover": { backgroundColor: "#1f2937" } }),
        }}
      >
        {required ? "Assign to Engineer (Required)" : "Assign Engineer"}
      </Button>

      {required && (
        // Secondary Text → 14px for helper text
        <Typography fontSize={14} color="text.secondary">
          High and Critical incidents must be handled by engineers.
        </Typography>
      )}
    </>
  );

  const ResolveSupportSection = ({ buttonLabel = "Resolve" }) => (
    <>
      <FormControl fullWidth size="small">
        <InputLabel sx={{ fontSize: 14 }}>Resolution Category</InputLabel>
        <Select
          value={selectedCategory}
          label="Resolution Category"
          onChange={(e) => setSelectedCategory(e.target.value)}
          sx={{ fontSize: 14 }}
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat} sx={{ fontSize: 14 }}>{cat}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Resolution Note"
        multiline
        rows={3}
        fullWidth
        value={resolutionNote}
        onChange={(e) => setResolutionNote(e.target.value)}
        // Normal Text → 16px for textarea input
        InputProps={{ sx: { fontSize: 14 } }}
        // Secondary Text → 14px for label
        InputLabelProps={{ sx: { fontSize: 14 } }}
      />

      <Button
        fullWidth
        variant="contained"
        onClick={resolveIncident}
        disabled={!selectedCategory || !resolutionNote.trim()}
        sx={{
          textTransform: "none",
          fontSize: 14, fontWeight: 600,
          backgroundColor: "#111827", "&:hover": { backgroundColor: "#1f2937" },
        }}
      >
        {buttonLabel}
      </Button>
    </>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ minHeight: "100vh", background: "#f0f2f5", position: "relative" }}>

      {/* Background decorations */}
      <Box sx={{ position: "fixed", top: -50, right: -50, width: 300, height: 300, borderRadius: "50%", background: alpha(T.cyan, 0.03), zIndex: 0 }} />
      <Box sx={{ position: "fixed", bottom: -70, left: -70, width: 400, height: 400, borderRadius: "50%", background: alpha(T.teal, 0.02), zIndex: 0 }} />
      <Box sx={{ position: "fixed", top: "20%", left: "10%", width: 200, height: 200, background: alpha(T.violet, 0.01), transform: "rotate(45deg)", zIndex: 0 }} />

      <Navbar />

      <Snackbar open={alert.open} autoHideDuration={4000}
        onClose={() => setAlert((a) => ({ ...a, open: false }))}>
        <Alert severity={alert.severity} variant="filled">{alert.message}</Alert>
      </Snackbar>

      <Box sx={{ p: 4, maxWidth: 600, margin: "0 auto", mt: "54px", zIndex: 1 }}>
        <Box sx={{
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          bgcolor: "#ffffff",
          overflow: "hidden",
        }}>

          {/* ── Header ── */}
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
              <IconButton onClick={() => navigate("/support/my-incidents")} size="small">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Metadata row */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", ml: 4 }}>
              {/* Secondary Text → 14px for created date */}
              <Typography fontSize={14} color="text.secondary">
                Created: {formatDate(incident.created_at)}
              </Typography>
              <StatusChip status={incident.status} label={formatStatus(incident.status)} size="small" />
              <PriorityBadge priority={incident.priority}>
                {formatPriority(incident.priority)}
              </PriorityBadge>
            </Box>
          </Box>

          <Box sx={{ height: "8px" }} />

          {/* ── Content ── */}
          <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>

            {/* Description — Normal Text → 16px */}
            <Typography fontSize={14}>
              <strong>Description:</strong> {incident.description || "N/A"}
            </Typography>

            {/* Assigned Engineer — Normal Text → 16px */}
            <Typography fontSize={14}>
              <strong>Assigned Engineer:</strong>{" "}
              {incident.assignedEngineer?.name || "Handled by Support"}
            </Typography>

            {/* Resolution note */}
            {incident.resolution_note && (
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", bgcolor: "#f0fdf4" }}>
                {/* Secondary Text → 14px for section label */}
                <Typography fontWeight={600} fontSize={14} mb={0.5}>Resolution</Typography>
                <Typography fontSize={14}>{incident.resolution_note}</Typography>
              </Box>
            )}

            {/* Attachments */}
            {(incident.attachments?.length > 0 || incident.attachment) && (
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", bgcolor: "#f9fafb" }}>
                {/* Secondary Text → 14px for section label */}
                <Typography fontWeight={600} fontSize={14} mb={1}>Attachments</Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  {incident.attachments?.map((att, idx) => (
                    <Box key={att.id || idx} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, borderRadius: 1, border: "1px solid #e5e7eb", bgcolor: "#fff" }}>
                      {/* Secondary Text → 14px for attachment link */}
                      <a href={getFullAttachmentUrl(att.file)} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: 14, textDecoration: "underline", color: "#1d4ed8" }}>
                        📎 {att.file_name}
                      </a>
                      {/* Small Text → 12px for upload date */}
                      <Typography fontSize={12} color="text.secondary">
                        {new Date(att.uploaded_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))}
                  {!incident.attachments?.length && incident.attachment && (
                    <a href={getFullAttachmentUrl(incident.attachment)} target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 14, textDecoration: "underline", color: "#1d4ed8" }}>
                      📎 {incident.attachment.split("/").pop()}
                    </a>
                  )}
                </Box>
              </Box>
            )}

            {/* Activity Timeline */}
            {incident.updates?.length > 0 && (
              <Accordion sx={{ bgcolor: "#f9fafb", borderRadius: 2, border: "1px solid #e5e7eb" }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, py: 1 }}>
                  {/* Secondary Text → 14px for accordion label */}
                  <Typography fontWeight={600} fontSize={14}>Activity Timeline</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ display: "flex", flexDirection: "column", gap: 1, px: 0 }}>
                  {incident.updates.map((update, idx) => (
                    <Box key={idx} sx={{ p: 1.5, borderRadius: 1.5, border: "1px solid #e5e7eb", bgcolor: "#fff", display: "flex", flexDirection: "column", gap: 0.5, mx: 2 }}>
                      {/* Normal Text → 16px for update message */}
                      <Typography fontSize={14}>{update.message}</Typography>
                      {/* Small Text → 12px for meta */}
                      <Typography fontSize={12} color="text.secondary">
                        {update.user?.name || "System"} • {formatDate(update.created_at)}
                      </Typography>
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}

            {/* ── Action Sections ── */}

            {/* CASE 1a — Open, Low/Medium, not reopened */}
            {isOpen && isLowMedium && !isReopenedBySupport && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <ResolveSupportSection buttonLabel="Resolve (Support)" />
                <EngineerAssignSection label="Assign to Engineer (Optional)" required={false} />
              </Box>
            )}

            {/* CASE 1b — Reopened by Support */}
            {isReopenedBySupport && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#fff7ed", border: "1px solid #fed7aa" }}>
                  {/* Secondary Text → 14px for banner heading */}
                  <Typography fontSize={14} color="#c2410c" fontWeight={600} mb={0.5}>
                    Incident Reopened
                  </Typography>
                  {/* Secondary Text → 14px for banner body */}
                  <Typography fontSize={14} color="#c2410c">
                    This incident was previously resolved by Support and has been reopened.
                    Please review and resolve it again, or escalate to an engineer.
                  </Typography>
                </Box>
                <ResolveSupportSection buttonLabel="Resolve Again" />
                {/* Small Text → 12px for divider label */}
                <Typography fontSize={12} color="text.secondary" textAlign="center">— or escalate —</Typography>
                <EngineerAssignSection label="Assign to Engineer" required={false} />
              </Box>
            )}

            {/* CASE 2 — Open, High/Critical */}
            {isOpen && isHighCritical && !isReopenedBySupport && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <EngineerAssignSection label="Assign to Engineer" required={true} />
              </Box>
            )}

            {/* CASE 3 — Assigned or In-Progress with engineer */}
            {(isAssigned || isInProgress) && hasEngineer && (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}>
                {/* Secondary Text → 14px for info message */}
                <Typography fontSize={14} color="#1e40af">
                  <strong>{incident.assignedEngineer.name}</strong> is currently handling this incident.
                  You will be able to verify and close it once they resolve it.
                </Typography>
              </Box>
            )}

            {/* CASE 4 — In-Progress, no engineer */}
            {isInProgress && !hasEngineer && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {/* Secondary Text → 14px for status message */}
                <Typography fontSize={14} color="text.secondary" sx={{ fontStyle: "italic" }}>
                  This incident was reopened. Please resolve it again.
                </Typography>
                <ResolveSupportSection buttonLabel="Resolve Again" />
              </Box>
            )}

            {/* CASE 5 — Resolved */}
            {isResolved && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {resolvedByEngineer && (
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    {/* Secondary Text → 14px for resolution info */}
                    <Typography fontSize={14} color="#166534">
                      Resolved by <strong>{incident.assignedEngineer.name}</strong>. Please verify the resolution and close or reopen the incident.
                    </Typography>
                  </Box>
                )}
                {resolvedBySupport && (
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                    <Typography fontSize={14} color="#166534">
                      Resolved by Support. You can close this incident or reopen it if further work is needed.
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: "flex", width: "100%", gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined" fullWidth
                    sx={{
                      flex: 1, textTransform: "none",
                      // Secondary Text → 14px for buttons
                      fontSize: 14, fontWeight: 600,
                      borderRadius: 1.5, height: 36,
                      borderColor: "#6b7280", color: "#374151",
                      "&:hover": { borderColor: "#4b5563", backgroundColor: "#f3f4f6" },
                    }}
                    onClick={reopenIncident}
                  >
                    Reopen
                  </Button>
                  <Button
                    variant="contained" fullWidth
                    sx={{
                      flex: 1, textTransform: "none",
                      fontSize: 14, fontWeight: 600,
                      borderRadius: 1.5, height: 36,
                      backgroundColor: "#000000", "&:hover": { backgroundColor: "#222020" },
                    }}
                    onClick={closeIncident}
                  >
                    {resolvedByEngineer ? "Verify & Close" : "Close"}
                  </Button>
                </Box>
              </Box>
            )}

          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SupIncidentDetail;