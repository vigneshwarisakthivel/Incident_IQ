import React, { useEffect, useState } from "react";
import Navbar from "../navbar";
import { useRef } from "react";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

import {
  Box,
  Typography,
  Paper,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  InputAdornment,
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
  Switch,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Tooltip,
  Fab,
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
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import ArticleIcon from "@mui/icons-material/Article";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import HistoryIcon from "@mui/icons-material/History";
import CloseIcon from "@mui/icons-material/Close";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TitleIcon from "@mui/icons-material/Title";
import LinkIcon from "@mui/icons-material/Link";

import {
  getKnowledgeBase,
  deleteKnowledgeBase,
  createKnowledgeBase,
  updateKnowledgeBase,
  getRelatedIncidents,
  submitForApproval,
  approveArticle,
  rejectArticle,
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

const isPending = (article) => article.status?.toLowerCase() === "pending";

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#f8f9fa",
    "& fieldset": { borderColor: "#e5e7eb" },
    "&:hover fieldset": { borderColor: "#1a1a1a" },
    "&.Mui-focused fieldset": { borderColor: "#1a1a1a" },
  },
});

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

const KnowledgeBase = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const typingTimeout = useRef(null);
  const [highestMatch, setHighestMatch] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [currentArticle, setCurrentArticle] = useState(null);
  const [relatedIncidents, setRelatedIncidents] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const totalArticles = articles.length;

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

  const [previewMode, setPreviewMode] = useState(false);

  const categories = ["Setup", "Troubleshooting", "FAQ", "Network", "Security", "Performance", "Configuration"];
  const statuses = ["Draft", "Pending", "Published"];

  const handleFormChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleCloseAlert = () => setAlert({ ...alert, open: false });
  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleSubmitApproval = async (id) => {
    try {
      await submitForApproval(id);
      setAlert({ open: true, message: "Submitted for admin review", severity: "success" });
      fetchArticles();
    } catch (error) {
      setAlert({ open: true, message: "Submission failed", severity: "error" });
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveArticle(id);
      setAlert({ open: true, message: "Article approved", severity: "success" });
      fetchArticles();
    } catch (error) {
      setAlert({ open: true, message: "Approval failed", severity: "error" });
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectArticle(id);
      setAlert({ open: true, message: "Article rejected", severity: "warning" });
      fetchArticles();
    } catch (error) {
      setAlert({ open: true, message: "Reject failed", severity: "error" });
    }
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleArrayFieldChange = (field) => (event, newValue) => {
    setFormData({ ...formData, [field]: newValue });
  };

  const fetchArticles = async () => {
    try {
      const res = await getKnowledgeBase();
      setArticles(res.data);
    } catch (error) {
      setAlert({ open: true, message: "Failed to fetch articles", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedIncidents = async (pattern) => {
    if (!pattern) return;
    try {
      const res = await getRelatedIncidents(pattern);
      setRelatedIncidents(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => { fetchArticles(); }, []);

  const filteredArticles = articles
    .filter((article) => {
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
    })
    .sort((a, b) => {
      const dateA = a.lastModified ? new Date(a.lastModified) : a.createdAt ? new Date(a.createdAt) : new Date(a.updated_at || a.id);
      const dateB = b.lastModified ? new Date(b.lastModified) : b.createdAt ? new Date(b.createdAt) : new Date(b.updated_at || b.id);
      return dateB - dateA;
    });

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this article?")) {
      try {
        await deleteKnowledgeBase(id);
        setArticles(articles.filter((a) => a.id !== id));
        setAlert({ open: true, message: "Article deleted successfully", severity: "success" });
      } catch (error) {
        setAlert({ open: true, message: "Failed to delete article", severity: "error" });
      }
    }
  };

  const capitalizeFirstLetter = (string) => {
    if (!string) return "";
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  };

  const handleOpenDialog = (mode, article = null) => {
    setDialogMode(mode);
    if (mode === "edit" && article) {
      setCurrentArticle(article);
      let mappedStatus = "draft";
      if (article.status) {
        const statusKey = article.status.toLowerCase();
        if (statusKey.includes("pending")) mappedStatus = "pending";
        else if (statusKey.includes("draft")) mappedStatus = "draft";
        else if (statusKey.includes("published")) mappedStatus = "published";
      }
      const mappedCategory = article.category ? article.category.toLowerCase() : "";
      setFormData({
        title: article.title || "",
        category: mappedCategory,
        status: mappedStatus,
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
    setPreviewMode(false);
    setOpenDialog(true);
  };

  const handleSaveArticle = async () => {
    if (!formData.title || !formData.category || !formData.incident_pattern) {
      setAlert({ open: true, message: "Please fill in all required fields", severity: "warning" });
      return;
    }
    if (highestMatch >= 90) {
      setAlert({ open: true, message: "A very similar incident already exists. Please review it instead.", severity: "error" });
      return;
    }
    try {
      const payload = {
        ...formData,
        category: formData.category.toLowerCase(),
        status: formData.status.toLowerCase(),
        incident_pattern: formData.incident_pattern,
        tags: formData.tags.map((tag) => tag.toLowerCase()),
      };
      if (dialogMode === "add") {
        const res = await createKnowledgeBase(payload);
        setArticles([...articles, res.data]);
      } else {
        const res = await updateKnowledgeBase(currentArticle.id, payload);
        setArticles(articles.map((a) => (a.id === currentArticle.id ? res.data : a)));
      }
      setOpenDialog(false);
      setAlert({ open: true, message: `Article ${dialogMode === "add" ? "created" : "updated"} successfully`, severity: "success" });
    } catch (error) {
      console.error("Save error:", error.response?.data || error);
      setAlert({ open: true, message: `Failed to ${dialogMode} article`, severity: "error" });
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

  const storedUser =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(sessionStorage.getItem("user"));
  const userRole = storedUser?.role;

  return (
    <Box sx={{ minHeight: "100vh", background: "#f0f2f5", position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "fixed", top: -50, right: -50, width: 300, height: 300, borderRadius: "50%", background: alpha(T.cyan, 0.03), zIndex: 0 }} />
      <Box sx={{ position: "fixed", bottom: -70, left: -70, width: 400, height: 400, borderRadius: "50%", background: alpha(T.teal, 0.02), zIndex: 0 }} />
      <Box sx={{ position: "fixed", top: "20%", left: "10%", width: 200, height: 200, background: alpha(T.violet, 0.01), transform: "rotate(45deg)", zIndex: 0 }} />

      <Navbar />

      <Snackbar open={alert.open} autoHideDuration={4000} onClose={handleCloseAlert}>
        <Alert severity={alert.severity} variant="filled">{alert.message}</Alert>
      </Snackbar>

      <Box sx={{ p: 4, maxWidth: "1200px", margin: "0 auto", position: "relative", zIndex: 1, mt: "54px" }}>
        <StyledPaper>

          {/* ── Header ── */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "#111827", width: 48, height: 48 }}>
                <DescriptionIcon />
              </Avatar>
              <Box>
                {/* Section Title → 20px */}
                <Typography fontSize={20} fontWeight={600}>Knowledge Base</Typography>
                {/* Secondary Text → 14px */}
                <Typography fontSize={14} color="text.secondary">
                  Manage articles and enable self-healing automation
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <Chip
                icon={<AutoFixHighIcon />}
                label="Self-Healing Active"
                color="success"
                variant="outlined"
                size="small"
              />
              {/* Small Text → 12px for total count */}
              <Typography fontSize={12} sx={{ bgcolor: "#f3f4f6", px: 2, py: 1, borderRadius: "8px", fontWeight: 500 }}>
                Total Articles: {filteredArticles.length}
              </Typography>
            </Box>
          </Box>

          {/* ── Search and Filters ── */}
          <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            {/* Search */}
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
                <MenuItem value="draft" sx={{ fontSize: "14px" }}>Draft</MenuItem>
                <MenuItem value="pending" sx={{ fontSize: "14px" }}>Pending</MenuItem>
                <MenuItem value="published" sx={{ fontSize: "14px" }}>Published</MenuItem>
              </Select>
            </FormControl>

            {/* Category Filter */}
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel sx={{ fontSize: "14px" }}>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{ fontSize: "14px", height: 34, "& .MuiSelect-select": { fontSize: "14px", paddingTop: 4, paddingBottom: 4 } }}
              >
                <MenuItem value="ALL" sx={{ fontSize: "14px" }}>All</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat} sx={{ fontSize: "14px" }}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Create Article Button */}
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog("add")}
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
              Create Article
            </Button>
          </Box>

          {/* ── Stats Cards ── */}
          <Box sx={{ mb: 3, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
            {/* Draft */}
            <Card sx={{ bgcolor: alpha("#9e9e9e", 0.05), border: "1px solid", borderColor: alpha("#9e9e9e", 0.2), minHeight: 70 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5 }}>
                <Box sx={{ position: "relative", display: "inline-flex", mr: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={totalArticles > 0 ? (articles.filter(a => a.status?.toLowerCase() === "draft").length / totalArticles) * 100 : 0}
                    size={60} thickness={5} sx={{ color: "#9e9e9e" }}
                  />
                  <Box sx={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {/* Normal Text → 16px for stat number */}
                    <Typography fontSize={16} fontWeight={600}>
                      {articles.filter(a => a.status?.toLowerCase() === "draft").length}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right", flex: 1 }}>
                  <DescriptionIcon sx={{ color: "#9e9e9e", fontSize: 20 }} />
                  {/* Secondary Text → 14px for label */}
                  <Typography fontSize={14} color="text.secondary">Draft</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Pending Review */}
            <Card sx={{ bgcolor: alpha("#f59e0b", 0.05), border: "1px solid", borderColor: alpha("#f59e0b", 0.2), minHeight: 70 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5 }}>
                <Box sx={{ position: "relative", display: "inline-flex", mr: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={totalArticles > 0 ? (articles.filter(a => a.status?.toLowerCase() === "pending").length / totalArticles) * 100 : 0}
                    size={60} thickness={5} sx={{ color: "#f59e0b" }}
                  />
                  <Box sx={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography fontSize={16} fontWeight={600}>
                      {articles.filter(a => a.status?.toLowerCase() === "pending").length}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right", flex: 1 }}>
                  <HistoryIcon sx={{ color: "#f59e0b", fontSize: 20 }} />
                  <Typography fontSize={14} color="text.secondary">Pending Review</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Published */}
            <Card sx={{ bgcolor: alpha("#10b981", 0.05), border: "1px solid", borderColor: alpha("#10b981", 0.2), minHeight: 70 }}>
              <CardContent sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5 }}>
                <Box sx={{ position: "relative", display: "inline-flex", mr: 1 }}>
                  <CircularProgress
                    variant="determinate"
                    value={totalArticles > 0 ? (articles.filter(a => a.status?.toLowerCase() === "published").length / totalArticles) * 100 : 0}
                    size={60} thickness={5} sx={{ color: "#10b981" }}
                  />
                  <Box sx={{ position: "absolute", top: 0, left: 0, bottom: 0, right: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography fontSize={16} fontWeight={600}>
                      {articles.filter(a => a.status?.toLowerCase() === "published").length}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ textAlign: "right", flex: 1 }}>
                  <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />
                  <Typography fontSize={14} color="text.secondary">Published</Typography>
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
                    {/* Secondary Text → 14px for table headers */}
                    <TableCell sx={{ fontWeight: 600, fontSize: "14px", width: "15%" }}>Title</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "14px", width: "15%" }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "14px", width: "15%" }}>Incident Pattern</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "14px", width: "15%" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: "14px", width: "15%" }}>Auto-Resolve</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: "14px", width: "15%" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredArticles
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((article) => (
                      <TableRow key={article.id} sx={{ "&:hover": { backgroundColor: "#f9fafb" }, "& td": { py: 1 } }}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Tooltip title={article.title}>
                              {/* Small Text → 12px for truncated table content */}
                              <Typography
                                fontSize="14px"
                                fontWeight={500}
                                sx={{
                                  maxWidth: 130,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}
                              >
                                {article.title}
                                {isPending(article) && (
                                  <Tooltip title="Pending Review - Needs attention">
                                    <FiberManualRecordIcon sx={{ fontSize: 8, color: "#ef4444", ml: 0.5 }} />
                                  </Tooltip>
                                )}
                              </Typography>
                            </Tooltip>
                          </Box>
                          {article.tags && article.tags.length > 0 && (
                            <Box sx={{ mt: 0.5, display: "flex", gap: 0.5 }}>
                              {article.tags.slice(0, 2).map((tag) => (
                                <Chip key={tag} label={tag} size="small" sx={{ height: 20, fontSize: 12 }} />
                              ))}
                            </Box>
                          )}
                        </TableCell>

                        <TableCell>
                          <Box sx={{
                            px: 1.5, py: 0.4, borderRadius: "6px",
                            // Small Text → 12px for category badge
                            fontSize: "12px", fontWeight: 500,
                            display: "inline-block",
                            bgcolor: "#eef2ff", color: "#4338ca",
                          }}>
                            {capitalizeFirstLetter(article.category)}
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Tooltip title={article.incident_pattern}>
                            <Typography
                              fontSize="14px"
                              color="text.secondary"
                              sx={{ maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            >
                              {article.incident_pattern}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        <TableCell>
                          <Box sx={{
                            px: 1.5, py: 0.4, borderRadius: "8px",
                            fontSize: 12, fontWeight: 500, display: "inline-block",
                            bgcolor:
                              article.status?.toLowerCase() === "published" ? "#ecfdf5" :
                              article.status?.toLowerCase() === "draft" ? "#fef3c7" :
                              article.status?.toLowerCase() === "pending" ? "#fef2f2" : "#f3f4f6",
                            color:
                              article.status?.toLowerCase() === "published" ? "#059669" :
                              article.status?.toLowerCase() === "draft" ? "#d97706" :
                              article.status?.toLowerCase() === "pending" ? "#dc2626" : "#6b7280",
                          }}>
                            {capitalizeFirstLetter(article.status)}
                          </Box>
                        </TableCell>

                        <TableCell>
                          {article.auto_resolve ? (
                            <Chip icon={<AutoFixHighIcon />} label="Auto" size="small" color="success" sx={{ height: 24, fontSize: 12 }} />
                          ) : (
                            <Chip label="Manual" size="small" variant="outlined" sx={{ height: 24, fontSize: 12 }} />
                          )}
                        </TableCell>

                        <TableCell align="right">
                          {userRole === "admin" && article.status === "Pending" && (
                            <>
                              <Tooltip title="Approve">
                                <IconButton onClick={() => handleApprove(article.id)} sx={{ color: "#16a34a" }}>
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton onClick={() => handleReject(article.id)} sx={{ color: "#dc2626" }}>
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                          {userRole === "admin" && (
                            <>
                              <Tooltip title="Edit">
                                <IconButton onClick={() => handleOpenDialog("edit", article)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton onClick={() => handleDelete(article.id)} sx={{ color: "#ef4444" }}>
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
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
          ADD / EDIT DIALOG
      ══════════════════════════════════════════════════════════ */}
      <StyledDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "24px",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle sx={{ pb: 1.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: "#ffffff" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "#1a1a1a", width: 40, height: 40 }}>
                <MenuBookIcon />
              </Avatar>
              <Box>
                {/* Section Title → 20px for dialog title */}
                <Typography fontSize={20} fontWeight={600}>
                  {dialogMode === "add" ? "Create New Article" : "Edit Article"}
                </Typography>
                {/* Secondary Text → 14px for subtitle */}
                <Typography fontSize={14} color="text.secondary">
                  {dialogMode === "add" ? "Add a new knowledge base article" : "Update your knowledge base article"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                size="small"
                onClick={() => setPreviewMode(!previewMode)}
                sx={{
                  borderRadius: "8px",
                  // Secondary Text → 14px
                  fontSize: 14,
                  textTransform: "none",
                  color: "text.secondary",
                  border: "1px solid",
                  borderColor: "divider",
                  px: 2,
                  "&:hover": { bgcolor: "#f8f9fa", borderColor: "#999" },
                }}
              >
                {previewMode ? "Edit" : "Preview"}
              </Button>
              <IconButton
                size="small"
                onClick={() => setOpenDialog(false)}
                sx={{ bgcolor: "#f8f9fa", borderRadius: "8px", "&:hover": { bgcolor: "#e5e7eb" } }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 4, bgcolor: "#ffffff" }}>
          {previewMode ? (
            // Preview Mode
            <Box sx={{ p: 1 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {formData.title || "Untitled Article"}
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 3, flexWrap: "wrap" }}>
                <Chip label={formData.category} size="small" sx={{ bgcolor: "#f3f4f6", borderRadius: "8px", fontSize: 12 }} />
                <Chip
                  label={formData.status}
                  size="small"
                  sx={{
                    bgcolor: formData.status === "published" ? "#e8f5e9" : "#fff3e0",
                    color: formData.status === "published" ? "#2e7d32" : "#b85c00",
                    borderRadius: "8px", fontSize: 12,
                  }}
                />
                {formData.auto_resolve && (
                  <Chip
                    icon={<AutoFixHighIcon sx={{ fontSize: 16 }} />}
                    label="Auto-Resolve Enabled"
                    size="small"
                    sx={{ bgcolor: "#e3f2fd", color: "#0b5e8e", borderRadius: "8px", fontSize: 12 }}
                  />
                )}
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Secondary Text → 14px for preview labels */}
              <Typography fontWeight={600} color="text.primary" fontSize={14} gutterBottom>Incident Pattern:</Typography>
              <Typography paragraph color="text.secondary" fontSize={14} sx={{ mb: 3 }}>
                {formData.incident_pattern || "No incident pattern provided"}
              </Typography>

              <Typography fontWeight={600} color="text.primary" fontSize={14} gutterBottom>Resolution Steps:</Typography>
              <Typography paragraph color="text.secondary" fontSize={14} sx={{ whiteSpace: "pre-line" }}>
                {formData.resolution_steps || "No resolution steps provided"}
              </Typography>

              {formData.tags && formData.tags.length > 0 && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {formData.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ borderRadius: "8px", fontSize: 12 }} />
                    ))}
                  </Box>
                </>
              )}
            </Box>
          ) : (
            // Edit Mode
            <Grid container spacing={2.5} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  label="Article Title"
                  required
                  size="small"
                  value={formData.title}
                  onChange={handleFormChange("title")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TitleIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                    // Normal Text → 16px for input value
                    sx: { fontSize: 14, borderRadius: "12px" },
                  }}
                  // Secondary Text → 14px for label
                  InputLabelProps={{ style: { fontSize: 14 } }}
                  placeholder="e.g., Database Connection Timeout Resolution"
                />
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: 14 }}>Category *</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category *"
                    onChange={handleFormChange("category")}
                    sx={{ borderRadius: "12px", backgroundColor: "#f8f9fa", fontSize: 14, "& .MuiSelect-select": { fontSize: 14, py: 1.5 } }}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat.toLowerCase()} sx={{ fontSize: 14 }}>
                        {capitalizeFirstLetter(cat)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel sx={{ fontSize: 14 }}>Status</InputLabel>
                  <Select
                    value={formData.status}
                    label="Status"
                    onChange={handleFormChange("status")}
                    sx={{ borderRadius: "12px", backgroundColor: "#f8f9fa", fontSize: 14, "& .MuiSelect-select": { fontSize: 14, py: 1.5 } }}
                  >
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status.toLowerCase()} sx={{ fontSize: 14 }}>
                        {capitalizeFirstLetter(status)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  label="Incident Pattern"
                  required
                  size="small"
                  multiline
                  rows={3}
                  value={formData.incident_pattern}
                  onChange={(e) => handlePatternChange(e.target.value)}
                  helperText="Describe the symptoms or triggers that identify this incident"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: "flex-start", mt: 1 }}>
                        <DescriptionIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                      </InputAdornment>
                    ),
                    sx: { fontSize: 14, borderRadius: "12px", alignItems: "flex-start" },
                  }}
                  InputLabelProps={{ style: { fontSize: 14 } }}
                  placeholder="e.g., When the database connection pool is exhausted and queries start timing out..."
                />
              </Grid>

              {/* Match alerts */}
              <Grid item xs={12}>
                {highestMatch >= 70 && highestMatch < 90 && (
                  <Alert severity="warning" sx={{ borderRadius: "12px", fontSize: 14, "& .MuiAlert-message": { fontSize: 14 } }}>
                    <Typography fontWeight={600}>Similar incidents exist ({highestMatch}% match)</Typography>
                    <Typography fontSize={12}>Please review before creating a new article.</Typography>
                  </Alert>
                )}
                {highestMatch >= 90 && (
                  <Alert severity="error" sx={{ borderRadius: "12px", fontSize: 14, "& .MuiAlert-message": { fontSize: 14 } }}>
                    <Typography fontWeight={600}>Very similar incident found ({highestMatch}% match)</Typography>
                    <Typography fontSize={12}>Consider using the existing article instead.</Typography>
                  </Alert>
                )}
              </Grid>

              {/* Related incidents */}
              {relatedIncidents.length > 0 && (
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2, bgcolor: "#f9fafb", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                    {/* Secondary Text → 14px for section label */}
                    <Typography fontSize={14} fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1.5, color: "text.secondary" }}>
                      <LinkIcon fontSize="small" /> Related Incidents Found
                    </Typography>
                    <List dense disablePadding>
                      {relatedIncidents.slice(0, 3).map((incident) => (
                        <ListItem
                          key={incident.id}
                          button
                          onClick={() => {
                            const article = articles.find((a) => a.id === incident.id);
                            if (article) handleOpenDialog("edit", article);
                          }}
                          sx={{ px: 1.5, py: 1, borderRadius: "8px", mb: 0.5, bgcolor: "#ffffff", border: "1px solid #e5e7eb", "&:hover": { bgcolor: "#f3f4f6" } }}
                        >
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <WarningIcon sx={{ fontSize: 16, color: "#f59e0b" }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={incident.title}
                            secondary={`${incident.match_percentage}% match`}
                            primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                            secondaryTypographyProps={{ fontSize: 12, color: "text.secondary" }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Paper>
                </Grid>
              )}

              <Grid item xs={12}>
                <StyledTextField
                  fullWidth
                  label="Resolution Steps"
                  size="small"
                  multiline
                  rows={4}
                  value={formData.resolution_steps}
                  onChange={handleFormChange("resolution_steps")}
                  InputProps={{ sx: { fontSize: 14, borderRadius: "12px" } }}
                  InputLabelProps={{ style: { fontSize: 14 } }}
                  placeholder="1. Check connection pool status&#10;2. Restart database service&#10;3. Verify connections are released properly&#10;4. Monitor for recurrence"
                />
              </Grid>

              <Grid item xs={12}>
                <Autocomplete
                  multiple
                  freeSolo
                  filterSelectedOptions
                  size="small"
                  options={[]}
                  value={formData.tags || []}
                  onChange={(event, newValue) => setFormData({ ...formData, tags: newValue })}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Tags"
                      placeholder="Type and press Enter to add tags"
                      size="small"
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#f8f9fa" } }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const value = e.target.value.trim();
                          if (value && !formData.tags?.includes(value)) {
                            setFormData({ ...formData, tags: [...(formData.tags || []), value] });
                          }
                          e.target.value = "";
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 3, p: 2, bgcolor: "#f9fafb", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {/* Secondary Text → 14px */}
                    <Typography fontSize={14} fontWeight={500}>Auto-Resolve:</Typography>
                    <Switch
                      size="small"
                      checked={formData.auto_resolve || false}
                      onChange={(e) => setFormData({ ...formData, auto_resolve: e.target.checked })}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#1a1a1a", "&:hover": { backgroundColor: alpha("#1a1a1a", 0.04) } },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#1a1a1a" },
                      }}
                    />
                  </Box>
                  {formData.auto_resolve && (
                    <TextField
                      label="Script Path"
                      size="small"
                      value={formData.script_path || ""}
                      onChange={handleFormChange("script_path")}
                      placeholder="/scripts/resolve.sh"
                      InputLabelProps={{ style: { fontSize: 14 } }}
                      InputProps={{ sx: { fontSize: 14 } }}
                      sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#ffffff" } }}
                    />
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "#ffffff", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setOpenDialog(false)}
            sx={{
              borderRadius: "12px",
              // Secondary Text → 14px
              fontSize: 14,
              textTransform: "none",
              flex: 1,
              borderColor: "#e0e0e0",
              color: "#666",
              py: 1,
              "&:hover": { borderColor: "#1a1a1a", backgroundColor: alpha("#1a1a1a", 0.04) },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveArticle}
            disabled={!formData.title || !formData.category || !formData.incident_pattern || highestMatch >= 90}
            sx={{
              borderRadius: "12px",
              fontSize: 14,
              textTransform: "none",
              flex: 2,
              py: 1,
              bgcolor: "#1a1a1a",
              color: "#fff",
              fontWeight: 600,
              "&:hover": { bgcolor: "#333" },
              "&:disabled": { bgcolor: "#cccccc", color: "#ffffff" },
            }}
          >
            {dialogMode === "add" ? "Create Article" : "Save Changes"}
          </Button>
        </DialogActions>
      </StyledDialog>

      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() => handleOpenDialog("add")}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default KnowledgeBase;