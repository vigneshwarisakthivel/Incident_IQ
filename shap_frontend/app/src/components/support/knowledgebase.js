import React, { useEffect, useState } from "react";
import Navbar from "../navbar";
import { useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Snackbar,
  Alert,
  alpha,
  Chip,
  CircularProgress,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Autocomplete,
} from "@mui/material";

import { styled } from "@mui/material/styles";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteIcon from "@mui/icons-material/Delete";
import CategoryIcon from "@mui/icons-material/Category";
import SearchIcon from "@mui/icons-material/Search";

import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import ArticleIcon from "@mui/icons-material/Article";
import VisibilityIcon from "@mui/icons-material/Visibility";

import {
  getKnowledgeBase,
  deleteKnowledgeBase,
  createKnowledgeBase,
  updateKnowledgeBase,
  getRelatedIncidents,
  submitForApproval,
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

const StyledDialog = styled(Dialog)({
  "& .MuiDialog-paper": {
    borderRadius: "20px",
    padding: "20px",
    maxWidth: "800px",
  },
});

// Read-only field component — same look as a disabled TextField
const ReadOnlyField = ({ label, value, multiline = false, rows = 1 }) => (
  <TextField
    label={label}
    fullWidth
    size="small"
    value={value || "—"}
    multiline={multiline}
    rows={multiline ? rows : undefined}
    InputProps={{ readOnly: true }}
    sx={{
      "& .MuiInputBase-root": {
        backgroundColor: "#f9fafb",
        color: "#374151",
      },
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: "#e5e7eb",
      },
    }}
  />
);

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

const SupportKnowledgeBase = () => {
  const storedUser =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));
  const currentUserId = storedUser?.id;

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const typingTimeout = useRef(null);
  const [highestMatch, setHighestMatch] = useState(0);

  // Edit/Create dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [currentArticle, setCurrentArticle] = useState(null);
  const [relatedIncidents, setRelatedIncidents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [previewMode, setPreviewMode] = useState(false);

  // View (read-only) dialog
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [viewArticle, setViewArticle] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    category: "",
    status: "draft",
    incident_pattern: "",
    resolution_steps: "",
    relatedIncidents: [],
    tags: [],
    auto_resolve: false,
    script_path: "",
    lastModified: new Date().toISOString(),
  });

  const categories = ["setup", "troubleshooting", "faq", "network", "security", "performance", "configuration"];
  const statuses = ["draft", "pending", "published"];
  const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchArticles = async () => {
    try {
      const res = await getKnowledgeBase();
      const normalized = res.data.map(a => ({ ...a, status: a.status?.toLowerCase() }));
      const visible = normalized.filter(
        (a) =>
          a.status === "published" ||
          (a.created_by === currentUserId &&
            (a.status === "draft" || a.status === "pending"))
      );
      setArticles(visible);
    } catch (error) {
      setAlert({ open: true, message: "Failed to fetch articles", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, []);

  // ─── Derived counts ────────────────────────────────────────────────────────
  const myArticles = articles.filter((a) => a.created_by === currentUserId);
  const totalMyArticles = myArticles.length || 1;

  // ─── Filters ──────────────────────────────────────────────────────────────
  const filteredArticles = articles.filter((article) => {
    const matchesCategory =
      categoryFilter === "ALL" ||
      article.category?.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "ALL" ||
      article.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesSearch =
      searchTerm === "" ||
      article.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.incident_pattern?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesStatus && matchesSearch;
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleCloseAlert = () => setAlert({ ...alert, open: false });
  const handleChangePage = (_, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleFormChange = (field) => (event) =>
    setFormData({ ...formData, [field]: event.target.value });

  const handleOpenDialog = (mode, article = null) => {
    setDialogMode(mode);
    if (mode === "edit" && article) {
      setCurrentArticle(article);
      setFormData({
        title: article.title || "",
        category: article.category || "",
        status: article.status || "draft",
        incident_pattern: article.incident_pattern || "",
        resolution_steps: article.resolution_steps || "",
        relatedIncidents: article.relatedIncidents || [],
        tags: article.tags || [],
        auto_resolve: article.auto_resolve || false,
        script_path: article.script_path || "",
        lastModified: new Date().toISOString(),
      });
    } else {
      setCurrentArticle(null);
      setFormData({
        title: "",
        category: "",
        status: "draft",
        incident_pattern: "",
        resolution_steps: "",
        relatedIncidents: [],
        tags: [],
        auto_resolve: false,
        script_path: "",
        lastModified: new Date().toISOString(),
      });
    }
    setRelatedIncidents([]);
    setHighestMatch(0);
    setPreviewMode(false);
    setOpenDialog(true);
  };

  // Open read-only view dialog
  const handleOpenView = (article) => {
    setViewArticle(article);
    setOpenViewDialog(true);
  };

  const handleSaveArticle = async () => {
    if (!formData.title || !formData.category || !formData.incident_pattern) {
      setAlert({ open: true, message: "Please fill in all required fields", severity: "warning" });
      return;
    }
    if (highestMatch >= 90) {
      setAlert({
        open: true,
        message: "A very similar article already exists. Please review it instead.",
        severity: "error",
      });
      return;
    }
    try {
      const payload = { ...formData, status: "draft", created_by: currentUserId };
      if (dialogMode === "add") {
        const res = await createKnowledgeBase(payload);
        setArticles([...articles, res.data]);
        setAlert({ open: true, message: "Article saved as Draft", severity: "success" });
      } else {
        const res = await updateKnowledgeBase(currentArticle.id, { ...formData, status: "draft" });
        setArticles(articles.map((a) => (a.id === currentArticle.id ? res.data : a)));
        setAlert({ open: true, message: "Draft updated successfully", severity: "success" });
      }
      setOpenDialog(false);
    } catch (error) {
      setAlert({ open: true, message: `Failed to save article`, severity: "error" });
    }
  };

  const autoResolveArticles = articles.filter((a) => a.auto_resolve).length;
  const categoriesCovered = new Set(articles.map((a) => a.category)).size;

  const handleSubmitApproval = async (id) => {
    try {
      await submitForApproval(id);
      setAlert({ open: true, message: "Article submitted for admin approval", severity: "success" });
      fetchArticles();
    } catch (error) {
      setAlert({ open: true, message: "Submission failed", severity: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this draft?")) {
      try {
        await deleteKnowledgeBase(id);
        setArticles(articles.filter((a) => a.id !== id));
        setAlert({ open: true, message: "Draft deleted", severity: "success" });
      } catch (error) {
        setAlert({ open: true, message: "Failed to delete article", severity: "error" });
      }
    }
  };

  const handlePatternChange = (value) => {
    setFormData({ ...formData, incident_pattern: value });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(async () => {
      if (!value) { setRelatedIncidents([]); setHighestMatch(0); return; }
      try {
        const res = await getRelatedIncidents(value);
        setRelatedIncidents(res.data);
        setHighestMatch(res.data.length > 0 ? res.data[0].match_percentage : 0);
      } catch (error) { console.error(error); }
    }, 500);
  };

  const isOwnDraft = (article) =>
    article.created_by === currentUserId && article.status === "draft";
  const isOwnPending = (article) =>
    article.created_by === currentUserId && article.status === "pending";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: "100vh", background: "#f0f2f5", position: "relative", overflow: "hidden" }}>
      <Box
        sx={{
          position: "fixed",
          top: -50,
          right: -50,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: alpha(T.cyan, 0.03),
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "fixed",
          bottom: -70,
          left: -70,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: alpha(T.teal, 0.02),
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: "fixed",
          top: "20%",
          left: "10%",
          width: 200,
          height: 200,
          background: alpha(T.violet, 0.01),
          transform: "rotate(45deg)",
          zIndex: 0,
        }}
      />
      <Navbar />

      <Snackbar open={alert.open} autoHideDuration={4000} onClose={handleCloseAlert}>
        <Alert severity={alert.severity} variant="filled">{alert.message}</Alert>
      </Snackbar>

      <Box sx={{ p: 4, maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1, mt: "54px" }}>
        <StyledPaper>
          {/* ── Header ── */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, pb: 2, borderBottom: "1px solid #e5e7eb" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "#111827", width: 46, height: 46 }}>
                <DescriptionIcon />
              </Avatar>
              <Box>
                {/* Page Title → 32px */}
                <Typography fontSize={20} fontWeight={600}>Knowledge Base</Typography>
                {/* Secondary Text → 14px */}
                <Typography fontSize={14} color="text.secondary">
                  Browse knowledge articles to resolve incidents quickly
                </Typography>
              </Box>
            </Box>
            {/* Small Text → 12px */}
            <Chip
              label={`${filteredArticles.length} Articles`}
              sx={{ bgcolor: "#f3f4f6", fontSize: "12px", fontWeight: 500 }}
            />
          </Box>

          {/* ── Filters ── */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                width: 240,
                "& .MuiInputBase-root": { height: 36, borderRadius: "8px" },
                // Normal Text → 16px for input; label stays MUI default
                "& .MuiInputBase-input": { fontSize: "14px" },
                "& .MuiInputLabel-root": { fontSize: "14px" },
              }}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, fontSize: 18, color: "text.secondary" }} /> }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel sx={{ fontSize: "14px" }}>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ height: 36, fontSize: "14px" }}
              >
                <MenuItem value="ALL" sx={{ fontSize: "14px" }}>All</MenuItem>
                <MenuItem value="draft" sx={{ fontSize: "14px" }}>My Drafts</MenuItem>
                <MenuItem value="pending" sx={{ fontSize: "14px" }}>Pending</MenuItem>
                <MenuItem value="published" sx={{ fontSize: "14px" }}>Published</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel sx={{ fontSize: "14px" }}>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{ height: 36, fontSize: "14px" }}
              >
                <MenuItem value="ALL" sx={{ fontSize: "14px" }}>All</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat} sx={{ fontSize: "14px" }}>
                    {capitalize(cat)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* ── Stats Cards ── */}
          <Box sx={{ mb: 3, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2 }}>
            {/* Published */}
            <Card sx={{ bgcolor: alpha("#10b981", 0.05), border: "1px solid", borderColor: alpha("#10b981", 0.2), minHeight: 70 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5 }}>
                <Box sx={{ position: "relative", display: "inline-flex", mr: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={(articles.filter((a) => a.status === "published").length / (articles.length || 1)) * 100}
                    size={60}
                    thickness={5}
                    sx={{ color: "#10b981" }}
                  />
                  <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {/* Normal Text → 16px for the count */}
                    <Typography fontSize={16} fontWeight={600}>
                      {articles.filter((a) => a.status === "published").length}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right", flex: 1 }}>
                  <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
                  {/* Secondary Text → 14px */}
                  <Typography fontSize={14} color="text.secondary">Published</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Auto Resolve */}
            <Card sx={{ bgcolor: alpha("#f59e0b", 0.05), border: "1px solid", borderColor: alpha("#f59e0b", 0.2), minHeight: 70 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5 }}>
                <Box sx={{ position: "relative", display: "inline-flex", mr: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={(articles.filter((a) => a.auto_resolve === true).length / (articles.length || 1)) * 100}
                    size={60}
                    thickness={5}
                    sx={{ color: "#f59e0b" }}
                  />
                  <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography fontSize={16} fontWeight={600}>
                      {articles.filter((a) => a.auto_resolve === true).length}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right", flex: 1 }}>
                  <AutoFixHighIcon sx={{ color: "#f59e0b", fontSize: 20 }} />
                  <Typography fontSize={14} color="text.secondary">Auto Resolve</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card sx={{ bgcolor: alpha("#3b82f6", 0.05), border: "1px solid", borderColor: alpha("#3b82f6", 0.2), minHeight: 70 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5 }}>
                <Box sx={{ position: "relative", display: "inline-flex", mr: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={(new Set(articles.map((a) => a.category)).size / (articles.length || 1)) * 100}
                    size={60}
                    thickness={5}
                    sx={{ color: "#3b82f6" }}
                  />
                  <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography fontSize={16} fontWeight={600}>
                      {new Set(articles.map((a) => a.category)).size}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right", flex: 1 }}>
                  <CategoryIcon sx={{ color: "#3b82f6", fontSize: 20 }} />
                  <Typography fontSize={14} color="text.secondary">Categories</Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* ── Table ── */}
          {loading ? (
            <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress /></Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead sx={{ backgroundColor: "#f9fafb" }}>
                  <TableRow>
                    {/* Table headers → Secondary Text (14px) */}
                    <TableCell sx={{ fontWeight: 600, fontSize: "14px", color: "#374151", width: "22%" }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "14px", color: "#374151", width: "12%" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "14px", color: "#374151", width: "22%" }}>Incident Pattern</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "14px", color: "#374151", width: "12%" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "14px", color: "#374151", width: "12%" }}>Auto-Resolve</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: "14px", color: "#374151", width: "18%" }}>View</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredArticles
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((article) => (
                      <TableRow
                        key={article.id}
                        sx={{ "&:hover": { backgroundColor: "#f8fafc" }, "& td": { py: 1 } }}
                      >
                        <TableCell>
                          <Tooltip title={article.title}>
                            {/* Table body cell title → Small Text (12px) */}
                            <Typography
                              fontSize="14px"
                              fontWeight={500}
                              sx={{ maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                              {article.title}
                            </Typography>
                          </Tooltip>
                          {article.tags?.length > 0 && (
                            <Box sx={{ mt: 0.5, display: "flex", gap: 0.5 }}>
                              {article.tags.slice(0, 2).map((tag) => (
                                <Chip key={tag} label={tag} size="small" sx={{ height: 20, fontSize: 12 }} />
                              ))}
                            </Box>
                          )}
                          {isOwnDraft(article) && (
                            <Chip
                              label="My Draft"
                              size="small"
                              sx={{ height: 18, fontSize: 12, mt: 0.5, bgcolor: "#fef9c3", color: "#92400e" }}
                            />
                          )}
                          {isOwnPending(article) && (
                            <Chip
                              label="Awaiting Approval"
                              size="small"
                              sx={{ height: 18, fontSize: 12, mt: 0.5, bgcolor: "#dbeafe", color: "#1d4ed8" }}
                            />
                          )}
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={capitalize(article.category)}
                            size="small"
                            sx={{ fontSize: "12px", fontWeight: 500, bgcolor: "#f3f4f6", color: "#374151" }}
                          />
                        </TableCell>

                        <TableCell>
                          <Tooltip title={article.incident_pattern}>
                            {/* Small Text → 12px for truncated body content */}
                            <Typography
                              fontSize="14px"
                              color="text.secondary"
                              sx={{ maxWidth: 160, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                              {article.incident_pattern}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        <TableCell>
                          <Box sx={{
                            px: 1.5, py: 0.4, borderRadius: "8px", fontSize: 12, fontWeight: 500, display: "inline-block",
                            bgcolor:
                              article.status === "published" ? "#ecfdf5"
                              : article.status === "draft" ? "#fef3c7"
                              : "#eff6ff",
                            color:
                              article.status === "published" ? "#059669"
                              : article.status === "draft" ? "#d97706"
                              : "#2563eb",
                          }}>
                            {capitalize(article.status)}
                          </Box>
                        </TableCell>

                        <TableCell>
                          {article.auto_resolve ? (
                            <Chip icon={<AutoFixHighIcon />} label="Auto" size="small" color="success" sx={{ height: 24, fontSize: 12 }} />
                          ) : (
                            <Chip label="Manual" size="small" variant="outlined" sx={{ height: 24, fontSize: 12 }} />
                          )}
                        </TableCell>

                        {/* ── View column ── */}
                        <TableCell align="center">
                          <Tooltip title="View Article">
                            <IconButton onClick={() => handleOpenView(article)} size="small">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component="div"
            count={filteredArticles.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ borderTop: "1px solid #e5e7eb", mt: 2, fontSize: 12 }}
          />
        </StyledPaper>
      </Box>

      {/* ══════════════════════════════════════════════════════════
          READ-ONLY VIEW DIALOG
      ══════════════════════════════════════════════════════════ */}
      <StyledDialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
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
        {/* HEADER */}
        <DialogTitle
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            borderBottom: "1px solid #e5e7eb",
            p: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "#111827", width: 40, height: 40 }}>
                <VisibilityIcon fontSize="small" />
              </Avatar>
              <Box>
                {/* Section Title → 20px */}
                <Typography fontWeight={600} fontSize={16}>
                  {viewArticle?.title || "Knowledge Article"}
                </Typography>
                {/* Small Text → 12px */}
                <Typography fontSize={12} color="text.secondary">
                  Article ID: #{viewArticle?.id || "N/A"}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={() => setOpenViewDialog(false)} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Metadata Row */}
          {viewArticle && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", ml: 4 }}>
              {/* Secondary Text → 14px */}
              <Typography fontSize={14} color="text.secondary">
                Category: {capitalize(viewArticle.category)}
              </Typography>
              <Chip
                label={capitalize(viewArticle.status)}
                size="small"
                sx={{
                  height: 22,
                  fontSize: 12,
                  bgcolor:
                    viewArticle.status === "published" ? "#ecfdf5"
                    : viewArticle.status === "draft" ? "#fef3c7"
                    : "#eff6ff",
                  color:
                    viewArticle.status === "published" ? "#059669"
                    : viewArticle.status === "draft" ? "#d97706"
                    : "#2563eb",
                  fontWeight: 500,
                }}
              />
              {viewArticle.auto_resolve ? (
                <Chip
                  icon={<AutoFixHighIcon />}
                  label="Auto Resolve"
                  size="small"
                  color="success"
                  sx={{ height: 22, fontSize: 12 }}
                />
              ) : (
                <Chip
                  label="Manual Resolution"
                  size="small"
                  variant="outlined"
                  sx={{ height: 22, fontSize: 12 }}
                />
              )}
            </Box>
          )}
        </DialogTitle>

        <Box sx={{ height: "8px" }} />

        {/* CONTENT */}
        <DialogContent sx={{ p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
          {viewArticle && (
            <>
              {/* Incident Pattern — Normal Text → 16px */}
              <Typography fontSize={14}>
                <strong>Incident Pattern:</strong> {viewArticle.incident_pattern || "N/A"}
              </Typography>

              {/* Resolution Steps */}
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", bgcolor: "#f9fafb" }}>
                {/* Section label → Secondary Text (14px) */}
                <Typography fontWeight={600} fontSize={14} mb={1}>
                  Resolution Steps
                </Typography>
                {/* Body content → Normal Text (16px) */}
                <Typography fontSize={14} whiteSpace="pre-line">
                  {viewArticle.resolution_steps || "N/A"}
                </Typography>
              </Box>

              {/* Script Path — Normal Text */}
              {viewArticle.auto_resolve && viewArticle.script_path && (
                <Typography fontSize={14}>
                  <strong>Automation Script:</strong> {viewArticle.script_path}
                </Typography>
              )}

              {/* Tags */}
              {viewArticle.tags?.length > 0 && (
                <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #e5e7eb", bgcolor: "#f9fafb" }}>
                  <Typography fontWeight={600} fontSize={14} mb={1}>
                    Tags
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {viewArticle.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{ height: 22, fontSize: 12, bgcolor: "#ffffff", border: "1px solid #e5e7eb" }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {/* Pending Approval Notice */}
              {isOwnPending(viewArticle) && (
                <Alert severity="info" sx={{ fontSize: 14 }}>
                  This article is currently <strong>under review</strong> by admin.
                </Alert>
              )}
            </>
          )}
        </DialogContent>
      </StyledDialog>
    </Box>
  );
};

export default SupportKnowledgeBase;