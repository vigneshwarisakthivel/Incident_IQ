import React, { useEffect, useState } from "react"; 
import Navbar from "../navbar";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import { FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Table,
  Dialog,
  DialogTitle,
  DialogContent,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Alert,
  alpha,
  CircularProgress,
  Chip,
  Tooltip,
  TextField,
  TablePagination,
  Badge,
} from "@mui/material";

import { styled } from "@mui/material/styles";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import EditIcon from "@mui/icons-material/Edit";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import WarningIcon from "@mui/icons-material/Warning";
import NewReleasesIcon from "@mui/icons-material/NewReleases";

import {
  getMyIncidents,
  getEngineers,
  deleteIncidentAPI,
  reopenIncidentAPI,
  assignEngineerAPI,
  resolveIncidentAPI,
  closeIncidentAPI
} from "../../services/apiServices";

// ─── Typography Scale ────────────────────────────────────────────────────────
// 32px → Page Title
// 20px → Section Title
// 16px → Normal Text
// 14px → Secondary Text
// 12px → Small Text

const StyledPaper = styled(Paper)({
  borderRadius: "20px",
  padding: "30px",
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
});

const prioritySLA = {
  critical: 2,
  high: 8,
  medium: 24,
  low: 72
};

const StatusChip = styled(Chip)(({ status }) => {
  const statusStyles = {
    open: { bgcolor: "#fef3c7", color: "#92400e", borderColor: "#fbbf24" },
    assigned: { bgcolor: "#e0f2fe", color: "#0369a1", borderColor: "#38bdf8" },
    "in-progress": { bgcolor: "#dbeafe", color: "#1e40af", borderColor: "#3b82f6" },
    resolved: { bgcolor: "#dcfce7", color: "#166534", borderColor: "#4ade80" },
    closed: { bgcolor: "#f3f4f6", color: "#374151", borderColor: "#9ca3af" },
  };
  const style = statusStyles[status?.toLowerCase()] || statusStyles.open;
  return {
    backgroundColor: style.bgcolor,
    color: style.color,
    borderColor: style.borderColor,
    fontWeight: 500,
    fontSize: "12px",
  };
});

const PriorityBadge = styled(Box)(({ priority }) => {
  const priorityStyles = {
    critical: { bgcolor: "#fef2f2", color: "#b91c1c", icon: "#ef4444" },
    high: { bgcolor: "#fff7ed", color: "#c2410c", icon: "#f97316" },
    medium: { bgcolor: "#fef9c3", color: "#854d0e", icon: "#eab308" },
    low: { bgcolor: "#ecfdf5", color: "#065f46", icon: "#10b981" },
  };
  const style = priorityStyles[priority?.toLowerCase()] || priorityStyles.medium;
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 0.5,
    px: 1.5,
    py: 0.4,
    borderRadius: "12px",
    backgroundColor: style.bgcolor,
    color: style.color,
    // Small Text → 12px for badges
    fontSize: "12px",
    fontWeight: 500,
  };
});

const NotificationDot = styled(Box)(({ color = "#ef4444", pulse = false }) => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  backgroundColor: color,
  display: "inline-block",
  marginLeft: "4px",
  animation: pulse ? "pulse 1.5s infinite" : "none",
  "@keyframes pulse": {
    "0%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(239, 68, 68, 0.7)" },
    "70%": { transform: "scale(1)", boxShadow: "0 0 0 6px rgba(239, 68, 68, 0)" },
    "100%": { transform: "scale(0.95)", boxShadow: "0 0 0 0 rgba(239, 68, 68, 0)" },
  },
}));

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

const MyIncident = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [engineers, setEngineers] = useState([]);
  const [selectedEngineer, setSelectedEngineer] = useState("");
  const [resolutionNote, setResolutionNote] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
  const [stats, setStats] = useState({ total: 0, open: 0, critical: 0, overdue: 0, awaitingVerification: 0 });

  const resolvedBy = selectedIncident?.resolved_by;
  const resolvedByEngineer = resolvedBy === "engineer";
  const resolvedBySupport = resolvedBy === "support";

  const handleCloseAlert = () => setAlert({ ...alert, open: false });
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const [selectedCategory, setSelectedCategory] = useState("");
  const categories = ["Setup", "Troubleshooting", "FAQ", "Network", "Security", "Performance", "Configuration"];

  const fetchEngineers = async () => {
    try {
      const res = await getEngineers();
      setEngineers(res.data);
    } catch (err) {
      console.error("Failed to fetch engineers");
    }
  };

  useEffect(() => { window.scrollTo(0, 0); }, []);

  const getFullAttachmentUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `https://incidentiq-backend.onrender.com/api/${cleanPath}`;
  };

  const needsVerification = (incident) => incident.status?.toLowerCase() === "resolved";

  const isNewlyCreated = (incident) => {
    if (!incident.created_at) return false;
    const created = new Date(incident.created_at);
    const now = new Date();
    const diffHours = (now - created) / (1000 * 60 * 60);
    return diffHours < 24 && incident.status?.toLowerCase() === "open";
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await getMyIncidents();
      const incidentsArray = res.data.incidents || [];
      const apiStats = res.data.stats || {};
      setIncidents(incidentsArray);
      setStats({
        total: apiStats.total || incidentsArray.length,
        critical: apiStats.critical || incidentsArray.filter(i => i.priority?.toLowerCase() === "critical").length,
        overdue: incidentsArray.filter(i => {
          if (["closed", "resolved"].includes(i.status?.toLowerCase())) return false;
          const created = new Date(i.created_at);
          const now = new Date();
          const diffHours = (now - created) / (1000 * 60 * 60);
          const sla = prioritySLA[i.priority?.toLowerCase()] || prioritySLA.medium;
          return diffHours > sla;
        }).length,
        open: incidentsArray.filter(i => i.status?.toLowerCase() === "open").length,
        awaitingVerification: incidentsArray.filter(i => i.status?.toLowerCase() === "resolved").length,
      });
    } catch (error) {
      setAlert({ open: true, message: "Failed to fetch incidents", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); fetchEngineers(); }, []);

  const assignEngineer = async () => {
    try {
      await assignEngineerAPI(selectedIncident.id, { engineer_id: selectedEngineer });
      setAlert({ open: true, message: "Engineer assigned successfully", severity: "success" });
      fetchIncidents();
      setViewDialogOpen(false);
    } catch (err) {
      setAlert({ open: true, message: "Failed to assign engineer", severity: "error" });
    }
  };

  const deleteIncident = async (incident) => {
    if (!incident) return;
    if (!window.confirm("Are you sure you want to delete this incident?")) return;
    try {
      await deleteIncidentAPI(incident.id);
      setAlert({ open: true, message: "Incident deleted successfully", severity: "success" });
      fetchIncidents();
      setViewDialogOpen(false);
      setSelectedIncident(null);
    } catch (err) {
      setAlert({ open: true, message: "Failed to delete incident", severity: "error" });
    }
  };

  const reopenIncident = async () => {
    try {
      await reopenIncidentAPI(selectedIncident.id);
      setAlert({ open: true, message: "Incident reopened", severity: "warning" });
      fetchIncidents();
      setViewDialogOpen(false);
    } catch (err) {
      setAlert({ open: true, message: "Failed to reopen incident", severity: "error" });
    }
  };

  const formatPriority = (priority) => {
    if (!priority) return "";
    return priority.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatStatus = (status) => {
    if (!status) return "";
    return status.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const resolveIncident = async () => {
    try {
      await resolveIncidentAPI(selectedIncident.id, {
        resolution_note: resolutionNote,
        category: selectedCategory
      });
      const confirmClose = window.confirm("Resolved successfully. Do you want to close the incident now?");
      if (confirmClose) await closeIncidentAPI(selectedIncident.id);
      fetchIncidents();
      setViewDialogOpen(false);
    } catch (err) {
      setAlert({ open: true, message: "Resolve failed", severity: "error" });
    }
  };

  const closeIncident = async () => {
    try {
      await closeIncidentAPI(selectedIncident.id);
      setAlert({ open: true, message: "Incident closed", severity: "success" });
      fetchIncidents();
      setViewDialogOpen(false);
    } catch (err) {
      setAlert({ open: true, message: "Close failed", severity: "error" });
    }
  };

  const handleViewIncident = (incident) => {
    setSelectedIncident(incident);
    setSelectedEngineer("");
    setResolutionNote("");
    setSelectedCategory("");
    setViewDialogOpen(true);
  };

  const getFilteredIncidents = () => {
    return incidents.filter((i) => {
      const statusMatch = statusFilter === "ALL" || i.status?.toLowerCase() === statusFilter.toLowerCase();
      const priorityMatch = priorityFilter === "ALL" || i.priority?.toLowerCase() === priorityFilter.toLowerCase();
      const searchMatch =
        i.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.assignedEngineer?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      return statusMatch && priorityMatch && searchMatch;
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const getSLAStatus = (createdAt, priority, status) => {
    if (!createdAt) return { status: "unknown", color: "#9ca3af" };
    if (["closed", "resolved"].includes(status?.toLowerCase())) return { status: "completed", color: "#9ca3af" };
    const created = new Date(createdAt);
    const now = new Date();
    const diffHours = (now - created) / (1000 * 60 * 60);
    const limit = prioritySLA[priority?.toLowerCase()] || prioritySLA.medium;
    if (diffHours > limit) return { status: "breached", color: "#dc2626" };
    if (diffHours > limit * 0.8) return { status: "at-risk", color: "#f97316" };
    return { status: "on-track", color: "#10b981" };
  };

  const filteredIncidents = getFilteredIncidents();

  const getNotificationMessage = (incident) => {
    if (needsVerification(incident)) return "Waiting for your verification";
    if (isNewlyCreated(incident)) return "New incident reported";
    const sla = getSLAStatus(incident.created_at, incident.priority, incident.status);
    if (sla.status === "breached") return "SLA breached - Overdue";
    if (sla.status === "at-risk") return "SLA at risk - Due soon";
    return null;
  };

  const isReopened = selectedIncident?.status?.toLowerCase() === "open" && selectedIncident?.resolved_by !== null;
  const isAssigned = !!selectedIncident?.assignedEngineer;
  const priority = selectedIncident?.priority?.toLowerCase();
  const isLowMedium = ["low", "medium"].includes(priority);
  const isHighCritical = ["high", "critical"].includes(priority);

  return (
    <Box sx={{ minHeight: "100vh", background: "#f0f2f5", position: "relative" }}>
      <Box sx={{ position: "fixed", top: -50, right: -50, width: 300, height: 300, borderRadius: "50%", background: alpha(T.cyan, 0.03), zIndex: 0 }} />
      <Box sx={{ position: "fixed", bottom: -70, left: -70, width: 400, height: 400, borderRadius: "50%", background: alpha(T.teal, 0.02), zIndex: 0 }} />
      <Box sx={{ position: "fixed", top: "20%", left: "10%", width: 200, height: 200, background: alpha(T.violet, 0.01), transform: "rotate(45deg)", zIndex: 0 }} />

      <Navbar />

      <Snackbar open={alert.open} autoHideDuration={4000} onClose={handleCloseAlert}>
        <Alert severity={alert.severity} variant="filled">{alert.message}</Alert>
      </Snackbar>

      <Box sx={{ p: 4, maxWidth: "1200px", margin: "0 auto", zIndex: 1, mt: "54px" }}>
        <StyledPaper>
          {/* ── Header ── */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "#b91c1c", width: 48, height: 48 }}>
                <ReportProblemIcon />
              </Avatar>
              <Box>
                {/* Section Title → 20px */}
                <Typography fontSize={20} fontWeight={600}>My Incidents</Typography>
                {/* Secondary Text → 14px */}
                <Typography fontSize={14} color="text.secondary">View incidents you have reported</Typography>
              </Box>
            </Box>

            {/* Stats chips — Small Text (12px) */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <Chip
                icon={<AccessTimeIcon />}
                label={`Overdue: ${stats.overdue}`}
                sx={{ bgcolor: stats.overdue ? "#fef2f2" : "#f3f4f6", color: stats.overdue ? "#b91c1c" : "#374151", fontWeight: 500, fontSize: 12 }}
              />
              <Chip
                icon={<PriorityHighIcon />}
                label={`Critical: ${stats.critical}`}
                sx={{ bgcolor: stats.critical ? "#fef2f2" : "#f3f4f6", color: stats.critical ? "#b91c1c" : "#374151", fontWeight: 500, fontSize: 12 }}
              />
              <Typography sx={{ bgcolor: "#f3f4f6", px: 2, py: 1, borderRadius: "8px", fontWeight: 500, fontSize: 12 }}>
                Total: {stats.total}
              </Typography>
            </Box>
          </Box>

          {/* ── Filter Bar ── */}
          <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                width: 220,
                "& .MuiInputBase-root": { height: 34, fontSize: "14px", borderRadius: "8px" },
              }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, fontSize: 18, color: "text.secondary" }} />,
              }}
            />

            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: "14px" }}>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ fontSize: "14px", height: 34, "& .MuiSelect-select": { fontSize: "14px", paddingTop: 4, paddingBottom: 4 } }}
              >
                <MenuItem value="ALL" sx={{ fontSize: "14px" }}>All</MenuItem>
                <MenuItem value="Open" sx={{ fontSize: "14px" }}>Open</MenuItem>
                <MenuItem value="Assigned" sx={{ fontSize: "14px" }}>Assigned</MenuItem>
                <MenuItem value="In-progress" sx={{ fontSize: "14px" }}>In-progress</MenuItem>
                <MenuItem value="Resolved" sx={{ fontSize: "14px" }}>Resolved</MenuItem>
                <MenuItem value="Closed" sx={{ fontSize: "14px" }}>Closed</MenuItem>
              </Select>
            </FormControl>

            {/* Priority Filter */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: "14px" }}>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => setPriorityFilter(e.target.value)}
                sx={{ fontSize: "14px", height: 34, "& .MuiSelect-select": { fontSize: "14px", paddingTop: 4, paddingBottom: 4 } }}
              >
                <MenuItem value="ALL" sx={{ fontSize: "14px" }}>All</MenuItem>
                <MenuItem value="Critical" sx={{ fontSize: "14px" }}>Critical</MenuItem>
                <MenuItem value="High" sx={{ fontSize: "14px" }}>High</MenuItem>
                <MenuItem value="Medium" sx={{ fontSize: "14px" }}>Medium</MenuItem>
                <MenuItem value="Low" sx={{ fontSize: "14px" }}>Low</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/support/create-incident/")}
              sx={{
                ml: "auto",
                textTransform: "none",
                // Secondary Text → 14px
                fontSize: "14px",
                fontWeight: 600,
                borderRadius: "8px",
                px: 2,
                height: 34,
                backgroundColor: "#111827",
                "&:hover": { backgroundColor: "#1f2937" },
              }}
            >
              Create Incident
            </Button>
          </Box>

          {/* ── Table ── */}
          {loading ? (
            <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: "#f9fafb" }}>
                  <TableRow>
                    {["Incident ID", "Title", "Priority", "Status", "Assigned Engineer", "SLA", "Created", "Actions"].map((col) => (
                      // Secondary Text → 14px for table headers
                      <TableCell key={col} sx={{ fontWeight: 600, fontSize: 14 }}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredIncidents.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((incident) => {
                    const sla = getSLAStatus(incident.created_at, incident.priority, incident.status);
                    const needsVerificationFlag = needsVerification(incident);
                    const isNew = isNewlyCreated(incident);
                    const notificationMessage = getNotificationMessage(incident);

                    return (
                      <TableRow
                        key={incident.id}
                        sx={{
                          "&:hover": { backgroundColor: "#f9fafb" },
                          backgroundColor: needsVerificationFlag ? alpha("#fef2f2", 0.3) : "inherit",
                        }}
                      >
                        <TableCell>
                          {/* Small Text → 12px for ID */}
                          <Typography fontSize={12} fontWeight={500} color="#b91c1c">
                            #{incident.id}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Tooltip title={incident.title}>
                            {/* Small Text → 12px for truncated title */}
                            <Typography
                              fontSize={12}
                              fontWeight={500}
                              sx={{
                                maxWidth: "150px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              {incident.title}
                              {notificationMessage && (
                                <Tooltip title={notificationMessage}>
                                  <FiberManualRecordIcon
                                    sx={{
                                      fontSize: 8,
                                      color: needsVerificationFlag ? "#ef4444" :
                                             sla.status === "breached" ? "#dc2626" :
                                             sla.status === "at-risk" ? "#f97316" : "transparent",
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        <TableCell>
                          <PriorityBadge priority={incident.priority}>
                            {incident.priority === "critical" && <PriorityHighIcon sx={{ fontSize: 12 }} />}
                            {formatPriority(incident.priority)}
                          </PriorityBadge>
                        </TableCell>

                        <TableCell>
                          <StatusChip status={incident.status} label={formatStatus(incident.status)} size="small" />
                        </TableCell>

                        <TableCell>
                          <Tooltip title={incident.assignedEngineer?.name || "Unassigned"}>
                            {/* Small Text → 12px */}
                            <Typography
                              fontSize={12}
                              sx={{ maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                              {incident.assignedEngineer?.name ||
                                (["resolved", "closed"].includes(incident.status?.toLowerCase())
                                  ? "Handled by Support"
                                  : "Unassigned")}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: sla.color }}>
                            <AccessTimeIcon sx={{ fontSize: 12 }} />
                            {/* Small Text → 12px */}
                            <Typography fontSize={12} fontWeight={500}>{sla.status}</Typography>
                          </Box>
                        </TableCell>

                        <TableCell>
                          {/* Small Text → 12px */}
                          <Typography fontSize={12}>{formatDate(incident.created_at)}</Typography>
                        </TableCell>

                        <TableCell>
                          <Tooltip title="View or Edit Details">
                            <IconButton onClick={() => handleViewIncident(incident)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton sx={{ color: "#ef4444" }} onClick={() => deleteIncident(incident)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component="div"
            count={filteredIncidents.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ borderTop: "1px solid #e5e7eb", mt: 2 }}
          />
        </StyledPaper>
      </Box>

      {/* ══════════════════════════════════════════════════════════
          VIEW / EDIT DIALOG
      ══════════════════════════════════════════════════════════ */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
            bgcolor: "#ffffff",
            maxWidth: 600,
          },
        }}
      >
        {/* Dialog Header */}
        <DialogTitle sx={{ display: "flex", flexDirection: "column", gap: 1, borderBottom: "1px solid #e5e7eb", p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "#b91c1c", width: 40, height: 40 }}>
                <ReportProblemIcon fontSize="small" />
              </Avatar>
              <Box>
                {/* Normal Text → 16px for dialog title */}
                <Typography fontWeight={600} fontSize={16}>
                  {selectedIncident?.title || "Incident Details"}
                </Typography>
                {/* Small Text → 12px for ID */}
                <Typography fontSize={12} color="text.secondary">
                  ID: #{selectedIncident?.id || "N/A"}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setViewDialogOpen(false)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Metadata row */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", ml: 4 }}>
            {/* Secondary Text → 14px */}
            <Typography fontSize={14} color="text.secondary">
              Created: {selectedIncident ? formatDate(selectedIncident.created_at) : "N/A"}
            </Typography>
            <StatusChip status={selectedIncident?.status} label={formatStatus(selectedIncident?.status)} size="small" />
            <PriorityBadge priority={selectedIncident?.priority}>
              {formatPriority(selectedIncident?.priority)}
            </PriorityBadge>
          </Box>
        </DialogTitle>

        <Box sx={{ height: "8px" }} />

        <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          {selectedIncident && (
            <>
              {/* Description — Normal Text → 16px */}
              <Typography fontSize={14}>
                <strong>Description:</strong> {selectedIncident.description || "N/A"}
              </Typography>

              {/* Assigned Engineer — Normal Text → 16px */}
              <Typography fontSize={14}>
                <strong>Assigned Engineer:</strong> {selectedIncident.assignedEngineer?.name || "Handled by Support"}
              </Typography>

              {/* Resolution Note */}
              {selectedIncident.resolution_note && (
                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", bgcolor: "#f0fdf4" }}>
                  {/* Secondary Text → 14px for section label */}
                  <Typography fontWeight={600} fontSize={14} mb={0.5}>Resolution</Typography>
                  <Typography fontSize={14}>{selectedIncident.resolution_note}</Typography>
                </Box>
              )}

              {/* Attachments */}
              {(selectedIncident.attachments?.length > 0 || selectedIncident.attachment) && (
                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", bgcolor: "#f9fafb" }}>
                  <Typography fontWeight={600} fontSize={14} mb={1}>Attachments</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {selectedIncident.attachments?.map((att, index) => (
                      <Box
                        key={att.id || index}
                        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1, borderRadius: 1, border: "1px solid #e5e7eb", bgcolor: "#ffffff" }}
                      >
                        <a
                          href={getFullAttachmentUrl(att.file)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 14, textDecoration: "underline", color: "#1d4ed8" }}
                        >
                          📎 {att.file_name}
                        </a>
                        {/* Small Text → 12px for date */}
                        <Typography fontSize={12} color="text.secondary">
                          {new Date(att.uploaded_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                    ))}
                    {!selectedIncident.attachments?.length && selectedIncident.attachment && (
                      <a
                        href={getFullAttachmentUrl(selectedIncident.attachment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 14, textDecoration: "underline", color: "#1d4ed8" }}
                      >
                        📎 {selectedIncident.attachment.split("/").pop()}
                      </a>
                    )}
                  </Box>
                </Box>
              )}

              {/* Activity Timeline */}
              {selectedIncident.updates?.length > 0 && (
                <Accordion sx={{ bgcolor: "#f9fafb", borderRadius: 2, border: "1px solid #e5e7eb" }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2, py: 1 }}>
                    {/* Secondary Text → 14px */}
                    <Typography fontWeight={600} fontSize={14}>Activity Timeline</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ display: "flex", flexDirection: "column", gap: 1, px: 0 }}>
                    {selectedIncident.updates.map((update, index) => (
                      <Box
                        key={index}
                        sx={{ p: 1.5, borderRadius: 1.5, border: "1px solid #e5e7eb", bgcolor: "#ffffff", display: "flex", flexDirection: "column", gap: 0.5, mx: 2 }}
                      >
                        {/* Normal Text → 16px for message */}
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

              {/* ── Resolution / Assignment Logic ── */}
              {selectedIncident &&
               selectedIncident.status?.toLowerCase() !== "resolved" &&
               !selectedIncident.assignedEngineer && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

                  {/* LOW / MEDIUM */}
                  {isLowMedium && (
                    <>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: 14 }}>Assign Engineer</InputLabel>
                        <Select
                          value={selectedEngineer}
                          label="Assign Engineer"
                          onChange={(e) => setSelectedEngineer(e.target.value)}
                          sx={{ fontSize: 14 }}
                        >
                          {engineers.map((eng) => (
                            <MenuItem key={eng.id} value={eng.id} sx={{ fontSize: 14 }}>{eng.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

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
                        InputProps={{ sx: { fontSize: 14 } }}
                        InputLabelProps={{ style: { fontSize: 14 } }}
                      />

                      <Box sx={{ display: "flex", gap: 2 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={resolveIncident}
                          disabled={!selectedCategory || !resolutionNote.trim()}
                          sx={{ textTransform: "none", fontSize: 14, fontWeight: 600, backgroundColor: "#111827" }}
                        >
                          Resolve (Support)
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={assignEngineer}
                          disabled={!selectedEngineer}
                          sx={{ textTransform: "none", fontSize: 14, fontWeight: 600 }}
                        >
                          Assign Engineer
                        </Button>
                      </Box>
                    </>
                  )}

                  {/* HIGH / CRITICAL */}
                  {isHighCritical && (
                    <>
                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: 14 }}>Assign Engineer</InputLabel>
                        <Select
                          value={selectedEngineer}
                          label="Assign Engineer"
                          onChange={(e) => setSelectedEngineer(e.target.value)}
                          sx={{ fontSize: 14 }}
                        >
                          {engineers.map((eng) => (
                            <MenuItem key={eng.id} value={eng.id} sx={{ fontSize: 14 }}>{eng.name}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      <Button
                        variant="contained"
                        onClick={assignEngineer}
                        disabled={!selectedEngineer}
                        sx={{ textTransform: "none", fontSize: 14, fontWeight: 600, backgroundColor: "#000000" }}
                      >
                        Assign to Engineer (Required)
                      </Button>

                      {/* Secondary Text → 14px */}
                      <Typography fontSize={14} color="text.secondary">
                        High and Critical incidents must be handled by engineers.
                      </Typography>
                    </>
                  )}
                </Box>
              )}

              {/* Resolved state — Reopen / Verify & Close */}
              {selectedIncident.status?.toLowerCase() === "resolved" && (
                <Box sx={{ display: "flex", width: "100%", gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    fullWidth
                    sx={{
                      flex: 1,
                      textTransform: "none",
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 1.5,
                      height: 36,
                      borderColor: "#6b7280",
                      color: "#374151",
                      "&:hover": { borderColor: "#4b5563", backgroundColor: "#f3f4f6" },
                    }}
                    onClick={reopenIncident}
                  >
                    Reopen
                  </Button>
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{
                      flex: 1,
                      textTransform: "none",
                      fontSize: 14,
                      fontWeight: 600,
                      borderRadius: 1.5,
                      height: 36,
                      backgroundColor: "#000000",
                      "&:hover": { backgroundColor: "#222020" },
                    }}
                    onClick={closeIncident}
                  >
                    Verify & Close
                  </Button>
                </Box>
              )}

              {/* In-Progress state */}
              {selectedIncident && selectedIncident.status?.toLowerCase() === "in-progress" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {resolvedBySupport ? (
                    <>
                      {/* Secondary Text → 14px */}
                      <Typography fontSize={14} color="text.secondary">
                        This incident was reopened. You can resolve it again.
                      </Typography>

                      <FormControl fullWidth size="small">
                        <InputLabel sx={{ fontSize: 14 }}>Resolution Category</InputLabel>
                        <Select
                          value={selectedCategory}
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
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                        InputProps={{ sx: { fontSize: 14 } }}
                        InputLabelProps={{ style: { fontSize: 14 } }}
                      />

                      <Button
                        variant="contained"
                        onClick={resolveIncident}
                        disabled={!selectedCategory || !resolutionNote.trim()}
                        sx={{ textTransform: "none", fontSize: 14, fontWeight: 600, backgroundColor: "#111827" }}
                      >
                        Resolve Again
                      </Button>
                    </>
                  ) : (
                    <Box sx={{ p: 2, bgcolor: "#f3f4f6", borderRadius: 2 }}>
                      {/* Secondary Text → 14px */}
                      <Typography fontSize={14} color="text.secondary">
                        {selectedIncident.assignedEngineer
                          ? `Assigned to ${selectedIncident.assignedEngineer.name} and in progress.`
                          : "Waiting for engineer assignment."}
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default MyIncident;