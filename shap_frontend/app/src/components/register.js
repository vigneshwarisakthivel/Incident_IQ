import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../images/incident.png";
import {
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Box,
  Paper,
  InputAdornment,
  IconButton,
  Link,
  Divider,
  Avatar,
  Chip,
  Alert,
  Snackbar,
} from "@mui/material";
import { styled, alpha, createTheme, ThemeProvider } from "@mui/material/styles";

import LockResetIcon from "@mui/icons-material/LockReset";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SecurityIcon from "@mui/icons-material/Security";
import GroupsIcon from "@mui/icons-material/Groups";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BoltIcon from "@mui/icons-material/Bolt";

import { createAdmin } from "../services/apiServices";
import { setRememberMePreference, getRememberedEmail } from "../services/authService";
import WelcomeImage from "../images/office.jpg";

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY SCALE
// 32px → Page Title
// 20px → Section Title
// 16px → Normal Text
// 14px → Secondary Text
// 12px → Small Text
// ─────────────────────────────────────────────────────────────────────────────

// ── DESIGN TOKENS
const T = {
  pageBg:     "#f0f2f9",
  white:      "#ffffff",
  surface:    "#f8f9fa",
  surfaceAlt: "#f4f6fb",
  border:     "#e8edf5",
  borderMd:   "#dde3ef",
  text:       "#0f1a2e",
  sub:        "#64748b",
  muted:      "#94a3b8",
  indigo:     "#6366f1",
  indigoL:    "#eef2ff",
  violet:     "#7c3aed",
  violetL:    "#f5f3ff",
  green:      "#0ea472",
  greenL:     "#ecfdf5",
  amber:      "#d97706",
  amberL:     "#fffbeb",
  red:        "#e53e3e",
  redL:       "#fff5f5",
  teal:       "#0d9488",
  tealL:      "#f0fdfa",
  cyan:       "#0891b2",
  cyanL:      "#ecfeff",
  dark:       "#1a1a1a",
  dark2:      "#111111",
  cardShadow:      "0 1px 4px rgba(15,26,46,0.06)",
  cardShadowHover: "0 6px 24px rgba(15,26,46,0.09)",
};

// ── MUI THEME
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

// ── INJECT STYLES
const injectStyles = () => {
  if (document.getElementById("reg-styles")) return;
  const s = document.createElement("style");
  s.id = "reg-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');

    @keyframes reg-fadeUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
    @keyframes reg-shimmer { 0%{background-position:0% center} 100%{background-position:200% center} }
    @keyframes reg-pulse   { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.1);opacity:0} }
    @keyframes reg-scan    { 0%{top:-60%} 100%{top:160%} }
    @keyframes reg-float   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }

    .reg-au { animation: reg-fadeUp 0.55s cubic-bezier(.16,1,.3,1) forwards; opacity:0; }

    .reg-live::after {
      content: "";
      position: absolute; inset: -4px; border-radius: 50%;
      border: 1.5px solid ${T.green};
      animation: reg-pulse 2s ease-out infinite;
    }

    .reg-scan-wrap { position:absolute;inset:0;overflow:hidden;border-radius:inherit;pointer-events:none; }
    .reg-scan { position:absolute;left:0;right:0;height:35%;
      background:linear-gradient(to bottom,transparent,rgba(99,102,241,0.04),transparent);
      animation:reg-scan 6s linear infinite; }

    /* Input styles — Secondary Text (14px) for label + value */
    .reg-input .MuiOutlinedInput-root {
      border-radius: 12px;
      background-color: ${T.surface};
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      transition: all 0.18s ease;
    }
    .reg-input .MuiOutlinedInput-root:hover {
      background-color: ${T.white};
    }
    .reg-input .MuiInputLabel-root {
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      color: ${T.sub};
    }
    .reg-input .MuiOutlinedInput-notchedOutline {
      border-color: ${T.border};
      transition: border-color 0.18s ease;
    }
    .reg-input .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline {
      border-color: ${T.indigo};
    }
    .reg-input .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
      border-color: ${T.indigo};
      border-width: 1.5px;
    }
    /* Helper text — Small Text (12px) */
    .reg-input .MuiFormHelperText-root {
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      margin-left: 12px;
    }

    .reg-btn-primary {
      transition: filter .18s ease, transform .18s ease, box-shadow .18s ease !important;
    }
    .reg-btn-primary:hover {
      filter: brightness(1.06) !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 8px 24px rgba(26,26,26,0.25) !important;
    }

    .reg-link {
      transition: color 0.18s ease;
    }
  `;
  document.head.appendChild(s);
};

// ── STYLED COMPONENTS
const StyledPaper = styled(Paper)(() => ({
  borderRadius: "24px",
  overflow: "hidden",
  backgroundColor: T.white,
  boxShadow: "0 25px 50px -12px rgba(15,26,46,0.25)",
  border: `1px solid ${T.border}`,
}));

const ImageOverlay = styled(Box)(() => ({
  position: "relative",
  height: "100%",
  minHeight: "500px",
  backgroundImage: `linear-gradient(135deg, ${alpha("#0f1a2e", 0.85)} 0%, ${alpha("#1a1a1a", 0.7)} 100%), url(${WelcomeImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  color: "white",
  textAlign: "center",
  padding: "40px",
  fontFamily: "'DM Sans', sans-serif",
}));

// Feature chips — Small Text (12px)
const FeatureChip = styled(Chip)(() => ({
  backgroundColor: alpha("#ffffff", 0.12),
  color: "white",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "100px",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.2px",
  "& .MuiChip-icon": {
    color: "white",
    fontSize: "14px !important",
  },
}));

// Links — Secondary Text (14px)
const LinkStyled = styled(Link)({
  color: T.indigo,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "14px",
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
  transition: "color 0.18s ease",
  "&:hover": {
    color: T.violet,
    textDecoration: "underline",
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// REGISTER COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const Register = () => {
  const [name, setName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
  const [errors, setErrors] = useState({ name: "", email: "", password: "", confirmPassword: "" });

  useEffect(() => { window.scrollTo(0, 0); }, []);
  useEffect(() => { injectStyles(); }, []);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const user  = JSON.parse(localStorage.getItem("user")) || JSON.parse(sessionStorage.getItem("user"));
    if (token && user) {
      if (user.role === "admin")          navigate("/admin/dashboard");
      else if (user.role === "support")   navigate("/support/dashboard");
      else if (user.role === "engineer")  navigate("/engineer/dashboard");
    }
  }, [navigate]);

  useEffect(() => {
    const rememberedEmail = getRememberedEmail();
    if (rememberedEmail) { setWorkEmail(rememberedEmail); setRememberMe(true); }
  }, []);

  const validateEmail    = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const validatePassword = (p) => /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/.test(p);

  const validateForm = () => {
    const newErrors = { name: "", email: "", password: "", confirmPassword: "" };
    let isValid = true;
    if (!name.trim())                      { newErrors.name = "Full name is required"; isValid = false; }
    else if (name.trim().length < 2)       { newErrors.name = "Name must be at least 2 characters"; isValid = false; }
    if (!workEmail)                        { newErrors.email = "Email is required"; isValid = false; }
    else if (!validateEmail(workEmail))    { newErrors.email = "Please enter a valid email address"; isValid = false; }
    if (!password)                         { newErrors.password = "Password is required"; isValid = false; }
    else if (!validatePassword(password))  { newErrors.password = "Min 8 chars with 1 uppercase, 1 number & 1 special character"; isValid = false; }
    if (!confirmPassword)                  { newErrors.confirmPassword = "Please confirm your password"; isValid = false; }
    else if (password !== confirmPassword) { newErrors.confirmPassword = "Passwords do not match"; isValid = false; }
    setErrors(newErrors);
    return isValid;
  };

  const handleCloseAlert = () => setAlert((a) => ({ ...a, open: false }));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setAlert({ open: true, message: "Please fix the validation errors", severity: "error" });
      return;
    }
    setLoading(true);
    try {
      const response = await createAdmin({ name, email: workEmail, password });
      setAlert({ open: true, message: "Account created successfully! Welcome aboard!", severity: "success" });
      setRememberMePreference(workEmail, rememberMe);
      setName(""); setWorkEmail(""); setPassword(""); setConfirmPassword(""); setRememberMe(false);
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      if (error.response) {
        const errorData = error.response.data;
        if (error.response.status === 409) {
          setAlert({ open: true, message: "This email is already registered. Try logging in instead.", severity: "error" });
        } else if (error.response.status === 400) {
          if (typeof errorData === "object") {
            const fieldErrors = {};
            Object.keys(errorData).forEach((key) => { if (key in errors) fieldErrors[key] = errorData[key]; });
            setErrors((prev) => ({ ...prev, ...fieldErrors }));
            setAlert({ open: true, message: "Please check the form for errors", severity: "error" });
          } else {
            setAlert({ open: true, message: errorData.message || "Validation failed. Please check your input.", severity: "error" });
          }
        } else {
          setAlert({ open: true, message: errorData.message || "Registration failed. Please try again later.", severity: "error" });
        }
      } else if (error.request) {
        setAlert({ open: true, message: "Network error. Please check your connection.", severity: "error" });
      } else {
        setAlert({ open: true, message: "An unexpected error occurred. Please try again.", severity: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange            = (e) => { setName(e.target.value);           if (errors.name)            setErrors({ ...errors, name: "" }); };
  const handleEmailChange           = (e) => { setWorkEmail(e.target.value);       if (errors.email)           setErrors({ ...errors, email: "" }); };
  const handlePasswordChange        = (e) => { setPassword(e.target.value);        if (errors.password)        setErrors({ ...errors, password: "" }); };
  const handleConfirmPasswordChange = (e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" }); };

  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8)          score++;
    if (/[A-Z]/.test(password))        score++;
    if (/\d/.test(password))           score++;
    if (/[@$!%*?&.#]/.test(password))  score++;
    return score;
  };
  const strengthScore  = getPasswordStrength();
  const strengthColors = ["#e8edf5", T.red, T.amber, T.amber, T.green];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <ThemeProvider theme={muiTheme}>

      {/* Fixed background */}
      <Box sx={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: T.pageBg, zIndex: 0 }}>
        <Box sx={{ position: "absolute", top: -50, right: -50, width: 300, height: 300, borderRadius: "50%", background: alpha(T.indigo, 0.03), pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", bottom: -70, left: -70, width: 400, height: 400, borderRadius: "50%", background: alpha(T.violet, 0.02), pointerEvents: "none" }} />
        <Box sx={{ position: "absolute", top: "20%", left: "10%", width: 200, height: 200, background: alpha(T.teal, 0.01), transform: "rotate(45deg)", pointerEvents: "none" }} />
      </Box>

      {/* Scrollable content */}
      <Box sx={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", alignItems: "center", py: { xs: 2, md: 0 }, overflowY: "auto" }}>
        <Container maxWidth="lg">
          <StyledPaper elevation={0}>
            <Grid container>

              {/* ══ LEFT — IMAGE PANEL */}
              <Grid item xs={12} md={6}>
                <ImageOverlay>
                  <div className="reg-scan-wrap"><div className="reg-scan" /></div>

                  {/* Feature chips — Small Text (12px) via FeatureChip */}
                  <Box sx={{ position: "absolute", top: 28, left: 28, display: "flex", gap: 1 }}>
                    <FeatureChip icon={<AdminPanelSettingsIcon />} label="Admin Access" size="small" />
                    <FeatureChip icon={<SecurityIcon />} label="Secure" size="small" />
                  </Box>

                  {/* Status pill — Small Text (12px) */}
                  <Box sx={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: "100px", px: "14px", py: "7px", mb: 1.5,
                  }}>
                    <Box className="reg-live" sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: T.green, position: "relative" }} />
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.1px" }}>
                      Built for internal support teams
                    </Typography>
                  </Box>

                  {/* Main heading — Page Title (32px) */}
                  <Typography sx={{
                    fontWeight: 900,
                    fontSize: { xs: "28px", md: "32px" },
                    letterSpacing: "-1.5px",
                    lineHeight: 1.1,
                    mb: 1.5,
                    fontFamily: "'DM Sans', sans-serif",
                    color: "#fff",
                  }}>
                    Join Your Team
                  </Typography>
                  {/* Gradient accent — Page Title (32px) */}
                  <Typography sx={{
                    fontWeight: 900,
                    fontSize: { xs: "28px", md: "32px" },
                    letterSpacing: "-1.5px",
                    lineHeight: 1.1,
                    mb: 2,
                    fontFamily: "'DM Sans', sans-serif",
                    background: `linear-gradient(100deg, ${T.indigo} 0%, ${T.violet} 60%)`,
                    backgroundSize: "200% auto",
                    animation: "reg-shimmer 5s linear infinite",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                    as Admin.
                  </Typography>

                  {/* Subtitle — Normal Text (16px) */}
                  <Typography sx={{
                    mb: 4, maxWidth: "360px",
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 400,
                    fontSize: "16px",
                    lineHeight: 1.85,
                    color: "rgba(255,255,255,0.7)",
                  }}>
                    Set up your team, configure SLA tiers, and manage every incident from a single live dashboard.
                  </Typography>

                  {/* Feature list — Secondary Text (14px) */}
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.8, mb: 1.5, alignItems: "center", width: "100%" }}>
                    {[
                      { Icon: TrendingUpIcon, text: "Real-time SLA monitoring" },
                      { Icon: GroupsIcon,     text: "Role-based access — 3 roles" },
                      { Icon: BoltIcon,       text: "Live analytics dashboard" },
                    ].map(({ Icon, text }) => (
                      <Box key={text} sx={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", maxWidth: "320px" }}>
                        <Box sx={{
                          width: 30, height: 30, borderRadius: "8px",
                          bgcolor: "rgba(255,255,255,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          border: "1px solid rgba(255,255,255,0.15)",
                        }}>
                          <Icon sx={{ fontSize: 15, color: "#fff", opacity: 0.9 }} />
                        </Box>
                        {/* Feature item label — Secondary Text (14px) */}
                        <Typography sx={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "14px",
                          fontWeight: 500,
                          color: "rgba(255,255,255,0.85)",
                          textAlign: "left",
                        }}>
                          {text}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Stats row */}
                  <Box sx={{ display: "flex", gap: 4, mt: 0 }}>
                    {[
                      { val: "3",    label: "User roles" },
                      { val: "4",    label: "SLA tiers" },
                      { val: "100%", label: "REST API" },
                    ].map(({ val, label }, i) => (
                      <React.Fragment key={label}>
                        {i > 0 && <Divider orientation="vertical" flexItem sx={{ bgcolor: "rgba(255,255,255,0.15)" }} />}
                        <Box sx={{ textAlign: "center" }}>
                          {/* Stat number — Page Title (32px) */}
                          <Typography sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 900,
                            fontSize: "32px",
                            letterSpacing: "-1px",
                            background: `linear-gradient(135deg, ${T.indigo}, ${T.white})`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            lineHeight: 1,
                          }}>
                            {val}
                          </Typography>
                          {/* Stat label — Small Text (12px) */}
                          <Typography sx={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "rgba(255,255,255,0.55)",
                          }}>
                            {label}
                          </Typography>
                        </Box>
                      </React.Fragment>
                    ))}
                  </Box>

                </ImageOverlay>
              </Grid>

              {/* ══ RIGHT — FORM */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: { xs: 3, sm: "48px 52px" }, display: "flex", flexDirection: "column", justifyContent: "flex-start", height: "100%" }}>

                  {/* Brand header */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
                    <Box component="img" src={Logo} alt="IncidentIQ Logo" sx={{ height: 44, width: "auto", objectFit: "contain" }} />
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      {/* Form panel heading — Section Title (20px) */}
                      <Typography sx={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 800,
                        fontSize: "20px",
                        letterSpacing: "-0.4px",
                        color: T.text,
                        lineHeight: 1.15,
                      }}>
                        Create Account
                      </Typography>
                      {/* Tagline — Small Text (12px) */}
                      <Typography sx={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 500,
                        fontSize: "12px",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: T.sub,
                      }}>
                        Register as admin to get full access
                      </Typography>
                    </Box>
                  </Box>

                  {/* ── Form fields — label + value via .reg-input at 14px (Secondary Text) */}
                  <form onSubmit={handleRegister}>

                    <Box className="reg-au" sx={{ animationDelay: "0.12s" }}>
                      <TextField
                        className="reg-input"
                        fullWidth
                        label="Full Name"
                        margin="normal"
                        value={name}
                        onChange={handleNameChange}
                        error={!!errors.name}
                        helperText={errors.name}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon sx={{ fontSize: 18, color: T.sub }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ mb: 0 }}
                      />
                    </Box>

                    <Box className="reg-au" sx={{ animationDelay: "0.18s" }}>
                      <TextField
                        className="reg-input"
                        fullWidth
                        label="Work Email"
                        margin="normal"
                        value={workEmail}
                        onChange={handleEmailChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon sx={{ fontSize: 18, color: T.sub }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    <Box className="reg-au" sx={{ animationDelay: "0.24s" }}>
                      <TextField
                        className="reg-input"
                        fullWidth
                        label="Password"
                        type={showPassword ? "text" : "password"}
                        margin="normal"
                        value={password}
                        onChange={handlePasswordChange}
                        error={!!errors.password}
                        helperText={errors.password}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockResetIcon sx={{ fontSize: 18, color: T.sub }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: T.sub }}>
                                {showPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    {/* Password strength bar */}
                    {password && (
                      <Box className="reg-au" sx={{ animationDelay: "0.26s", mt: -0.5, mb: 1 }}>
                        <Box sx={{ display: "flex", gap: "4px", mb: "4px" }}>
                          {[1, 2, 3, 4].map((level) => (
                            <Box key={level} sx={{
                              height: 3, flex: 1, borderRadius: 2,
                              bgcolor: level <= strengthScore ? strengthColors[strengthScore] : T.border,
                              transition: "background-color .3s ease",
                            }} />
                          ))}
                        </Box>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          {/* Strength label — Small Text (12px) */}
                          <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: T.sub }}>
                            {strengthScore > 0 ? "Password strength: " : ""}
                            <Box component="span" sx={{ fontWeight: 700, color: strengthColors[strengthScore] }}>
                              {strengthLabels[strengthScore]}
                            </Box>
                          </Typography>
                          {/* Strength hint — Small Text (12px) */}
                          {!validatePassword(password) && password.length > 0 && (
                            <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "12px", color: T.red }}>
                              8+ chars, 1 uppercase, 1 number, 1 symbol
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}

                    <Box className="reg-au" sx={{ animationDelay: "0.30s" }}>
                      <TextField
                        className="reg-input"
                        fullWidth
                        label="Confirm Password"
                        type={showConfirmPassword ? "text" : "password"}
                        margin="normal"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        error={!!errors.confirmPassword}
                        helperText={errors.confirmPassword}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LockResetIcon sx={{ fontSize: 18, color: T.sub }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small" sx={{ color: T.sub }}>
                                {showConfirmPassword ? <VisibilityOffIcon sx={{ fontSize: 18 }} /> : <VisibilityIcon sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Box>

                    <Box sx={{ mt: 1.5 }} />

                    {/* Submit button — Normal Text (16px) */}
                    <Box className="reg-au" sx={{ animationDelay: "0.36s" }}>
                      <Button
                        fullWidth
                        type="submit"
                        disabled={loading}
                        className="reg-btn-primary"
                        sx={{
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 700,
                          fontSize: "16px",
                          textTransform: "none",
                          letterSpacing: "-0.2px",
                          borderRadius: "12px",
                          py: "13px",
                          background: T.dark,
                          color: "#fff",
                          boxShadow: "0 4px 16px rgba(26,26,26,0.2)",
                          "&:hover": {},
                          "&:disabled": { background: T.border, color: T.muted, boxShadow: "none" },
                        }}
                      >
                        {loading ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : "Create Account"}
                      </Button>
                    </Box>

                    {/* Sign in prompt — Secondary Text (14px) */}
                    <Box className="reg-au" sx={{ animationDelay: "0.42s", mt: 3, textAlign: "center" }}>
                      <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: T.sub, fontWeight: 400 }}>
                        Already have an account?{" "}
                        {/* Link — Secondary Text (14px) via LinkStyled */}
                        <LinkStyled href="#" onClick={(e) => { e.preventDefault(); navigate("/login"); }}>
                          Sign in
                        </LinkStyled>
                      </Typography>
                    </Box>

                  </form>
                </Box>
              </Grid>

            </Grid>
          </StyledPaper>
        </Container>
      </Box>

      {/* Snackbar — Small Text (12px) */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ zIndex: 9999 }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          variant="filled"
          sx={{
            width: "100%",
            boxShadow: T.cardShadowHover,
            fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "12px",
            borderRadius: "12px",
            border: `1px solid ${T.border}`,
          }}
        >
          {alert.message}
        </Alert>
      </Snackbar>

    </ThemeProvider>
  );
};

export default Register;