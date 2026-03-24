import React, { useState, useEffect } from "react";
import Navbar from "../navbar";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  alpha,
  CircularProgress,
  IconButton,
  Chip
} from "@mui/material";

import { styled } from "@mui/material/styles";

import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import TitleIcon from "@mui/icons-material/Title";
import DescriptionIcon from "@mui/icons-material/Description";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import EngineeringIcon from "@mui/icons-material/Engineering";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";

import { createIncident, getRelatedIncidents, getEngineers } from "../../services/apiServices";

// ─── Typography Scale ────────────────────────────────────────────────────────
// 32px → Page Title
// 20px → Section Title
// 16px → Normal Text
// 14px → Secondary Text
// 12px → Small Text

const StyledPaper = styled(Paper)({
  borderRadius: "24px",
  padding: "28px",
  backgroundColor: "#ffffff",
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
});

// ─── Tokens ───────────────────────────────────────────────────────────────────
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

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#f8f9fa",
  },
});

const CreateButton = styled(Button)({
  borderRadius: "12px",
  padding: "12px",
  backgroundColor: "#1a1a1a",
  color: "#fff",
  fontWeight: 600,
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#333",
  },
  "&:disabled": {
    backgroundColor: "#cccccc",
  }
});

const CreateIncident = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [assignedEngineer, setAssignedEngineer] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [searchingKB, setSearchingKB] = useState(false);
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  // Fetch engineers
  useEffect(() => {
    const fetchEngineers = async () => {
      try {
        const res = await getEngineers();
        setEngineers(res.data || []);
      } catch (error) {
        console.error("Failed to fetch engineers", error);
      }
    };
    fetchEngineers();
  }, []);

  const handleArticleClick = (article) => {
    const confirmOpen = window.confirm(
      "A knowledge solution already exists for this issue.\n\nDo you want to open the article instead of creating an incident?"
    );
    if (confirmOpen) {
      navigate(`/knowledgebase/${article.id}`);
    }
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!title || title.length < 3) {
        setRelatedArticles([]);
        return;
      }
      try {
        setSearchingKB(true);
        const res = await getRelatedIncidents(title);
        setRelatedArticles(res.data || []);
      } catch (error) {
        console.error("Failed to fetch related knowledge articles", error);
      } finally {
        setSearchingKB(false);
      }
    };
    const delayDebounce = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(delayDebounce);
  }, [title]);

  const handleCreateIncident = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setAlert({ open: true, message: "Please enter an incident title", severity: "error" });
      return;
    }
    if (!description.trim()) {
      setAlert({ open: true, message: "Please enter a description", severity: "error" });
      return;
    }

    setLoading(true);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("priority", priority);
      if (assignedEngineer) formData.append("assigned_to", assignedEngineer);
      selectedFiles.forEach((file) => formData.append("attachments", file));

      const response = await createIncident(formData);

      setAlert({ open: true, message: "Incident created successfully!", severity: "success" });

      setTitle("");
      setDescription("");
      setPriority("medium");
      setAssignedEngineer("");
      setSelectedFiles([]);

      setTimeout(() => { navigate("/support/my-incident"); }, 2000);

    } catch (error) {
      console.error("Error creating incident:", error);
      let errorMessage = "Failed to create incident";
      if (error.response) {
        if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (typeof error.response.data === 'object') {
          const errors = Object.entries(error.response.data)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(', ');
          if (errors) errorMessage = errors;
        }
      }
      setAlert({ open: true, message: errorMessage, severity: "error" });
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const getTotalSize = () => {
    const totalBytes = selectedFiles.reduce((acc, file) => acc + file.size, 0);
    return (totalBytes / (1024 * 1024)).toFixed(2);
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "#f0f2f5",
      position: "relative",
      overflow: "hidden",
    }}>
      <Box sx={{ position: "fixed", top: -50, right: -50, width: 300, height: 300, borderRadius: "50%", background: alpha(T.cyan, 0.03), zIndex: 0 }} />
      <Box sx={{ position: "fixed", bottom: -70, left: -70, width: 400, height: 400, borderRadius: "50%", background: alpha(T.teal, 0.02), zIndex: 0 }} />
      <Box sx={{ position: "fixed", top: "20%", left: "10%", width: 200, height: 200, background: alpha(T.violet, 0.01), transform: "rotate(45deg)", zIndex: 0 }} />

      <Navbar />

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={alert.severity} variant="filled" onClose={handleCloseAlert} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      </Snackbar>

      <Box sx={{ p: 4, maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: 1, mt: "54px" }}>
        <StyledPaper>
          {/* ── Header ── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Avatar sx={{ bgcolor: "#1a1a1a", width: 56, height: 56 }}>
              <ReportProblemIcon />
            </Avatar>
            <Box>
              {/* Section Title → 20px */}
              <Typography fontSize={20} fontWeight={600}>
                Create New Incident
              </Typography>
              {/* Secondary Text → 14px */}
              <Typography fontSize={14} color="text.secondary">
                Fill in the details below to report a new incident
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleCreateIncident}>
            {/* ── Title Field ── */}
            <StyledTextField
              fullWidth
              label="Incident Title"
              margin="normal"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <TitleIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
                // Normal Text → 16px for input value
                sx: { fontSize: 16 },
              }}
              // Secondary Text → 14px for label
              InputLabelProps={{ style: { fontSize: 14 } }}
              placeholder="e.g., System outage, Bug report, etc."
            />

            {/* ── KB Suggestions ── */}
            {searchingKB && (
              <Box sx={{ mt: 1 }}>
                <CircularProgress size={16} />
              </Box>
            )}

            {relatedArticles.length > 0 && (
              <Paper
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: "12px",
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                {/* Secondary Text → 14px for section label */}
                <Typography fontSize={14} fontWeight={600} mb={1}>
                  Suggested Knowledge Articles
                </Typography>

                {relatedArticles.map((article) => (
                  <Box
                    key={article.id}
                    onClick={() => handleArticleClick(article)}
                    sx={{
                      mb: 1.5,
                      p: 1.5,
                      borderRadius: "10px",
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      cursor: "pointer",
                      transition: "0.2s",
                      "&:hover": { backgroundColor: "#f3f4f6" },
                    }}
                  >
                    {/* Normal Text → 16px for article title */}
                    <Typography fontSize={14} fontWeight={600}>
                      {article.title}
                    </Typography>
                    {/* Small Text → 12px for pattern */}
                    <Typography fontSize={12} color="text.secondary">
                      {article.incident_pattern}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            )}

            {/* ── Description Field ── */}
            <StyledTextField
              fullWidth
              label="Description"
              margin="normal"
              required
              multiline
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                    <DescriptionIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                ),
                sx: { fontSize: 16 },
              }}
              InputLabelProps={{ style: { fontSize: 14 } }}
              placeholder="Provide detailed information about the incident..."
            />

            {/* ── Priority ── */}
            <FormControl fullWidth margin="normal" size="small">
              <InputLabel sx={{ fontSize: 14 }}>Priority *</InputLabel>
              <Select
                value={priority}
                label="Priority *"
                onChange={(e) => setPriority(e.target.value)}
                required
                sx={{
                  borderRadius: "12px",
                  backgroundColor: "#f8f9fa",
                  fontSize: 16,
                  "& .MuiSelect-select": { fontSize: 16, py: 1.5 },
                }}
                startAdornment={
                  <InputAdornment position="start" sx={{ ml: 1, mr: 0 }}>
                    <PriorityHighIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                  </InputAdornment>
                }
              >
                {/* Secondary Text → 14px for menu items */}
                <MenuItem value="low" sx={{ fontSize: 14 }}>Low</MenuItem>
                <MenuItem value="medium" sx={{ fontSize: 14 }}>Medium</MenuItem>
                <MenuItem value="high" sx={{ fontSize: 14 }}>High</MenuItem>
                <MenuItem value="critical" sx={{ fontSize: 14 }}>Critical</MenuItem>
              </Select>
            </FormControl>

            {/* ── File Upload ── */}
            <Box sx={{ mt: 3 }}>
              {/* Secondary Text → 14px for section label */}
              <Typography fontSize={14} fontWeight={500} mb={1}>
                Attachments
              </Typography>

              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadFileIcon />}
                disabled={uploading}
                sx={{
                  borderRadius: "12px",
                  // Secondary Text → 14px for button label
                  fontSize: 14,
                  textTransform: "none",
                  borderColor: "#e0e0e0",
                  color: "#1a1a1a",
                  "&:hover": {
                    borderColor: "#1a1a1a",
                    backgroundColor: alpha("#1a1a1a", 0.04),
                  }
                }}
              >
                Choose Files
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx"
                />
              </Button>

              {/* Small Text → 12px for hint */}
              <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.5 }}>
                Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, Excel (Max 10MB per file)
              </Typography>

              {/* ── Selected Files List ── */}
              {selectedFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    {/* Small Text → 12px for file count */}
                    <Typography fontSize={12} fontWeight={500}>
                      Selected Files ({selectedFiles.length})
                    </Typography>
                    <Chip
                      label={`Total: ${getTotalSize()} MB`}
                      size="small"
                      sx={{ fontSize: 12 }}
                    />
                  </Box>

                  {selectedFiles.map((file, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        bgcolor: '#f8f9fa',
                        borderRadius: '8px',
                        mb: 1,
                        border: '1px solid #e0e0e0',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
                        <AttachFileIcon sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }} />
                        <Box sx={{ overflow: 'hidden' }}>
                          {/* Small Text → 12px for filename */}
                          <Typography
                            fontSize={12}
                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}
                          >
                            {file.name}
                          </Typography>
                          {/* Small Text → 12px for file size */}
                          <Typography fontSize={12} color="text.secondary">
                            {(file.size / 1024).toFixed(1)} KB
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton size="small" onClick={() => removeFile(index)} disabled={uploading} sx={{ color: '#666' }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* ── Action Buttons ── */}
            <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/my-incidents')}
                sx={{
                  borderRadius: "12px",
                  // Secondary Text → 14px
                  fontSize: 14,
                  textTransform: "none",
                  flex: 1,
                  borderColor: "#e0e0e0",
                  color: "#666",
                }}
              >
                Cancel
              </Button>

              <CreateButton
                fullWidth
                type="submit"
                disabled={loading || !title.trim() || !description.trim()}
                sx={{
                  // Secondary Text → 14px for button
                  fontSize: 14,
                  flex: 2,
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={20} color="inherit" />
                    <span>Creating...</span>
                  </Box>
                ) : "Create Incident"}
              </CreateButton>
            </Box>
          </form>
        </StyledPaper>
      </Box>
    </Box>
  );
};

export default CreateIncident;