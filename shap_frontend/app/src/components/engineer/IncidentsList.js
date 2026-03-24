import React, { useEffect, useState, useMemo } from "react";
import Navbar from "../navbar";
import { useNavigate, useLocation } from "react-router-dom";
import SearchIcon        from "@mui/icons-material/Search";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import AccessTimeIcon    from "@mui/icons-material/AccessTime";
import PriorityHighIcon  from "@mui/icons-material/PriorityHigh";
import EditIcon          from "@mui/icons-material/Edit";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import {
  Box, Typography, Paper, Avatar, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Snackbar, Alert,
  alpha, CircularProgress, Chip, Tooltip, TextField, TablePagination,
  FormControl, InputLabel, Select, MenuItem,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { getAssignedIncidents } from "../../services/apiServices";

// ─── Typography Scale ────────────────────────────────────────────────────────
// 32px → Page Title
// 20px → Section Title
// 16px → Normal Text
// 14px → Secondary Text
// 12px → Small Text

// ─── Styled components ────────────────────────────────────────────────────────

const StyledPaper = styled(Paper)({
  borderRadius: "20px",
  padding: "30px",
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
});

const StatusChip = styled(Chip)(({ status }) => {
  const s = {
    open:        { bgcolor: "#fef3c7", color: "#92400e",  borderColor: "#fbbf24" },
    assigned:    { bgcolor: "#e0f2fe", color: "#0369a1",  borderColor: "#38bdf8" },
    in_progress: { bgcolor: "#fff7ed", color: "#c2410c",  borderColor: "#fb923c" },
    resolved:    { bgcolor: "#dcfce7", color: "#166534",  borderColor: "#4ade80" },
    closed:      { bgcolor: "#f3f4f6", color: "#374151",  borderColor: "#9ca3af" },
  }[status?.toLowerCase()] || { bgcolor: "#fef3c7", color: "#92400e", borderColor: "#fbbf24" };
  return {
    backgroundColor: s.bgcolor,
    color: s.color,
    borderColor: s.borderColor,
    fontWeight: 500,
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

// ─── Theme tokens ─────────────────────────────────────────────────────────────

const T = {
  cyan: "#0891b2", teal: "#0d9488", violet: "#7c3aed",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SLA_LIMITS = { critical: 2, high: 8, medium: 24, low: 72 };

const fmt = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  }) : "N/A";

const capitalize = (s) =>
  s ? s.replace(/_|-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

const getSLAStatus = (createdAt, priority, status) => {
  if (!createdAt) return { status: "unknown", color: "#9ca3af" };
  if (["closed", "resolved"].includes(status?.toLowerCase()))
    return { status: "completed", color: "#9ca3af" };
  const hrs   = (Date.now() - new Date(createdAt)) / 3_600_000;
  const limit = SLA_LIMITS[priority?.toLowerCase()] ?? SLA_LIMITS.medium;
  if (hrs > limit)        return { status: "breached",  color: "#dc2626" };
  if (hrs > limit * 0.8)  return { status: "at-risk",   color: "#f97316" };
  return { status: "on-track", color: "#10b981" };
};

const isOverdue = (i) => {
  if (["closed", "resolved"].includes(i.status?.toLowerCase())) return false;
  const hrs   = (Date.now() - new Date(i.created_at)) / 3_600_000;
  const limit = SLA_LIMITS[i.priority?.toLowerCase()] ?? SLA_LIMITS.medium;
  return hrs > limit;
};

// ─── Component ────────────────────────────────────────────────────────────────

const IncidentsList = () => {
  const navigate   = useNavigate();
  const location   = useLocation();
  const params     = new URLSearchParams(location.search);
  const initFilter = params.get("filter") || "all";

  const [incidents,      setIncidents]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [alert,          setAlert]          = useState({ open: false, message: "", severity: "success" });
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [page,           setPage]           = useState(0);
  const [rowsPerPage,    setRowsPerPage]    = useState(5);

  const isOverdueView  = initFilter === "overdue";
  const isResolvedView = initFilter === "resolved";

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => { window.scrollTo(0, 0); }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await getAssignedIncidents();
      setIncidents(res.data || []);
    } catch {
      setAlert({ open: true, message: "Failed to fetch incidents", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchIncidents(); }, []);

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = useMemo(() => ({
    total:    incidents.length,
    overdue:  incidents.filter(isOverdue).length,
    critical: incidents.filter((i) => i.priority?.toLowerCase() === "critical").length,
  }), [incidents]);

  // ── Filtered & sorted list ─────────────────────────────────────────────────

  const filteredIncidents = useMemo(() => {
    let list = [...incidents];

    if (isOverdueView)  list = list.filter(isOverdue);
    if (isResolvedView) list = list.filter((i) => i.status?.toLowerCase() === "resolved");

    if (search)
      list = list.filter((i) =>
        i.title?.toLowerCase().includes(search.toLowerCase()) ||
        (i.reportedBy?.name ?? "").toLowerCase().includes(search.toLowerCase())
      );

    if (statusFilter !== "ALL")
      list = list.filter(
        (i) => i.status?.toLowerCase().replace(/-/g, "_") === statusFilter.toLowerCase()
      );

    if (priorityFilter !== "ALL")
      list = list.filter((i) => i.priority?.toLowerCase() === priorityFilter.toLowerCase());

    return list.sort((a, b) => {
      const dA = a.assigned_at ? new Date(a.assigned_at) : new Date(a.created_at);
      const dB = b.assigned_at ? new Date(b.assigned_at) : new Date(b.created_at);
      return dB - dA;
    });
  }, [incidents, search, statusFilter, priorityFilter, isOverdueView, isResolvedView]);

  // ── Page meta ──────────────────────────────────────────────────────────────

  const pageTitle = isOverdueView
    ? "Overdue Incidents"
    : isResolvedView
    ? "Resolved Incidents"
    : "All Incidents";

  const pageSubtitle = isOverdueView
    ? "Incidents that have breached their SLA window"
    : isResolvedView
    ? "Incidents that have been resolved"
    : "All incidents assigned to you";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Box sx={{ minHeight: "100vh", background: "#f0f2f5", position: "relative" }}>
      <Box sx={{ position: "fixed", top: -50, right: -50, width: 300, height: 300, borderRadius: "50%", background: alpha(T.cyan, 0.03), zIndex: 0 }} />
      <Box sx={{ position: "fixed", bottom: -70, left: -70, width: 400, height: 400, borderRadius: "50%", background: alpha(T.teal, 0.02), zIndex: 0 }} />
      <Box sx={{ position: "fixed", top: "20%", left: "10%", width: 200, height: 200, background: alpha(T.violet, 0.01), transform: "rotate(45deg)", zIndex: 0 }} />

      <Navbar />

      <Snackbar open={alert.open} autoHideDuration={4000}
        onClose={() => setAlert((a) => ({ ...a, open: false }))}>
        <Alert severity={alert.severity} variant="filled">{alert.message}</Alert>
      </Snackbar>

      <Box sx={{ p: 4, maxWidth: "1200px", margin: "0 auto", mt: "54px" }}>
        <StyledPaper>

          {/* ── Header ── */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "#b91c1c", width: 48, height: 48 }}>
                <ReportProblemIcon />
              </Avatar>
              <Box>
                {/* Section Title → 20px */}
                <Typography fontSize={20} fontWeight={600}>{pageTitle}</Typography>
                {/* Secondary Text → 14px */}
                <Typography fontSize={14} color="text.secondary">{pageSubtitle}</Typography>
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

          {/* ── Filter bar ── */}
          <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            {/* Search */}
            <TextField
              size="small"
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{
                width: 220,
                "& .MuiInputBase-root": { height: 34, fontSize: "14px", borderRadius: "8px" },
              }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, fontSize: 18, color: "text.secondary" }} /> }}
            />

            {/* Status */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: "14px" }}>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                sx={{ fontSize: "14px", height: 34, "& .MuiSelect-select": { fontSize: "14px", paddingTop: 4, paddingBottom: 4 } }}
              >
                <MenuItem value="ALL"         sx={{ fontSize: "14px" }}>All</MenuItem>
                <MenuItem value="open"        sx={{ fontSize: "14px" }}>Open</MenuItem>
                <MenuItem value="assigned"    sx={{ fontSize: "14px" }}>Assigned</MenuItem>
                <MenuItem value="in_progress" sx={{ fontSize: "14px" }}>In Progress</MenuItem>
                <MenuItem value="resolved"    sx={{ fontSize: "14px" }}>Resolved</MenuItem>
                <MenuItem value="closed"      sx={{ fontSize: "14px" }}>Closed</MenuItem>
              </Select>
            </FormControl>

            {/* Priority */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: "14px" }}>Priority</InputLabel>
              <Select
                value={priorityFilter}
                label="Priority"
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(0); }}
                sx={{ fontSize: "14px", height: 34, "& .MuiSelect-select": { fontSize: "14px", paddingTop: 4, paddingBottom: 4 } }}
              >
                <MenuItem value="ALL"      sx={{ fontSize: "14px" }}>All</MenuItem>
                <MenuItem value="critical" sx={{ fontSize: "14px" }}>Critical</MenuItem>
                <MenuItem value="high"     sx={{ fontSize: "14px" }}>High</MenuItem>
                <MenuItem value="medium"   sx={{ fontSize: "14px" }}>Medium</MenuItem>
                <MenuItem value="low"      sx={{ fontSize: "14px" }}>Low</MenuItem>
              </Select>
            </FormControl>

            {/* Active filter badges — Small Text (12px) */}
            {isOverdueView && (
              <Chip
                label="Overdue only" size="small"
                onDelete={() => navigate("/engineer/incidents")}
                sx={{ height: 24, fontSize: 12, bgcolor: "#fef2f2", color: "#b91c1c", fontWeight: 600 }}
              />
            )}
            {isResolvedView && (
              <Chip
                label="Resolved only" size="small"
                onDelete={() => navigate("/engineer/incidents")}
                sx={{ height: 24, fontSize: 12, bgcolor: "#dcfce7", color: "#166534", fontWeight: 600 }}
              />
            )}
          </Box>

          {/* ── Table ── */}
          {loading ? (
            <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
          ) : filteredIncidents.length === 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 1 }}>
              <ReportProblemIcon sx={{ fontSize: 36, color: "#d1d5db" }} />
              {/* Secondary Text → 14px for empty state */}
              <Typography fontSize={14} color="text.secondary" fontWeight={500}>No incidents found</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: "#f9fafb" }}>
                  <TableRow>
                    {["Incident ID", "Title", "Priority", "Status", "Reported By", "SLA", "Created", "Actions"].map((col) => (
                      // Secondary Text → 14px for table headers
                      <TableCell key={col} sx={{ fontWeight: 600, fontSize: 14 }}>{col}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredIncidents
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((incident) => {
                      const sla        = getSLAStatus(incident.created_at, incident.priority, incident.status);
                      const inProgress = incident.status?.toLowerCase() === "in_progress";

                      return (
                        <TableRow
                          key={incident.id}
                          sx={{ "&:hover": { backgroundColor: "#f9fafb" } }}
                        >
                          {/* ID — Small Text (12px) */}
                          <TableCell>
                            <Typography fontSize={12} fontWeight={500} color="#b91c1c">
                              #{incident.id}
                            </Typography>
                          </TableCell>

                          {/* Title — Small Text (12px) */}
                          <TableCell>
                            <Tooltip title={incident.title}>
                              <Typography
                                fontSize={12} fontWeight={500}
                                sx={{ maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: 0.5 }}
                              >
                                {incident.title}
                                {inProgress && (
                                  <Tooltip title="In Progress – needs attention">
                                    <FiberManualRecordIcon sx={{ fontSize: 8, color: "#ef4444" }} />
                                  </Tooltip>
                                )}
                              </Typography>
                            </Tooltip>
                          </TableCell>

                          {/* Priority */}
                          <TableCell>
                            <PriorityBadge priority={incident.priority}>
                              {incident.priority?.toLowerCase() === "critical" && <PriorityHighIcon sx={{ fontSize: 12 }} />}
                              {capitalize(incident.priority)}
                            </PriorityBadge>
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <StatusChip
                              status={incident.status}
                              label={capitalize(incident.status)}
                              size="small"
                            />
                          </TableCell>

                          {/* Reported By — Small Text (12px) */}
                          <TableCell>
                            <Tooltip title={incident.reportedBy?.name || "Support"}>
                              <Typography fontSize={12} sx={{ maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {incident.reportedBy?.name || "Support"}
                              </Typography>
                            </Tooltip>
                          </TableCell>

                          {/* SLA — Small Text (12px) */}
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: sla.color }}>
                              <AccessTimeIcon sx={{ fontSize: 12 }} />
                              <Typography fontSize={12} fontWeight={500}>{sla.status}</Typography>
                            </Box>
                          </TableCell>

                          {/* Created — Small Text (12px) */}
                          <TableCell>
                            <Typography fontSize={12}>{fmt(incident.created_at)}</Typography>
                          </TableCell>

                          {/* Actions */}
                          <TableCell align="center">
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/engineer/incidents/${incident.id}`)}
                              >
                                <EditIcon fontSize="small" />
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
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ borderTop: "1px solid #e5e7eb", mt: 2 }}
          />

        </StyledPaper>
      </Box>
    </Box>
  );
};

export default IncidentsList;