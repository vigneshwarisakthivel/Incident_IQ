import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Logo from "../images/incident.png";
import {
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
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
  Snackbar
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import BusinessIcon from "@mui/icons-material/Business";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SecurityIcon from "@mui/icons-material/Security";
import GroupsIcon from "@mui/icons-material/Groups";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { loginUser } from "../services/apiServices";
import WelcomeImage from "../images/office.jpg";

// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY SCALE
// 32px → Page Title
// 20px → Section Title
// 16px → Normal Text
// 14px → Secondary Text
// 12px → Small Text
// ─────────────────────────────────────────────────────────────────────────────

// ── DESIGN TOKENS — matching Home.js exactly
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

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: "24px",
  overflow: "hidden",
  backgroundColor: T.white,
  boxShadow: "0 25px 50px -12px rgba(15,26,46,0.25)",
  border: `1px solid ${T.border}`,
}));

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

const ImageOverlay = styled(Box)(({ theme }) => ({
  position: "relative",
  height: "100%",
  minHeight: "500px",
  backgroundImage: `linear-gradient(135deg, ${alpha('#0f1a2e', 0.85)} 0%, ${alpha('#1a1a1a', 0.7)} 100%), url(${WelcomeImage})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  color: "white",
  textAlign: "center",
  padding: theme.spacing(4),
}));

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: T.surface,
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.18s ease",
    "&:hover": {
      backgroundColor: T.white,
      "& fieldset": { borderColor: T.indigo },
    },
    "&.Mui-focused": {
      backgroundColor: T.white,
      "& fieldset": { borderColor: T.indigo, borderWidth: "1.5px" },
    },
  },
  "& .MuiInputLabel-root": {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px", // Secondary Text
    color: T.sub,
    "&.Mui-focused": { color: T.indigo },
  },
  "& .MuiOutlinedInput-input": {
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "14px", // Secondary Text
    color: T.text,
  },
});

const LoginButton = styled(Button)({
  borderRadius: "12px",
  padding: "12px",
  background: T.dark,
  color: "#fff",
  fontWeight: 700,
  fontSize: "16px", // Normal Text — primary CTA
  textTransform: "none",
  fontFamily: "'DM Sans', sans-serif",
  boxShadow: "0 4px 16px rgba(26,26,26,0.2)",
  transition: "all 0.18s ease",
  "&:hover": {
    background: T.dark2,
    transform: "translateY(-2px)",
    boxShadow: "0 8px 24px rgba(26,26,26,0.25)",
  },
  "&:disabled": {
    background: T.muted,
  },
});

const FeatureChip = styled(Chip)({
  backgroundColor: alpha('#ffffff', 0.12),
  color: 'white',
  border: '1px solid rgba(255,255,255,0.2)',
  borderRadius: '100px',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "12px", // Small Text
  fontWeight: 600,
  letterSpacing: "0.2px",
  '& .MuiChip-icon': {
    color: 'white',
    fontSize: "14px",
  },
});

const LinkStyled = styled(Link)({
  color: T.indigo,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "14px", // Secondary Text
  fontWeight: 600,
  textDecoration: "none",
  cursor: "pointer",
  transition: "color 0.18s ease",
  "&:hover": {
    color: T.violet,
    textDecoration: "underline",
  },
});

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setAlert({ open: true, message: "Please enter both email and password", severity: "warning" });
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser({ email, password });
      const token = response.data.token;
      const user = response.data.user;

      if (rememberMe) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");
      } else {
        sessionStorage.setItem("token", token);
        sessionStorage.setItem("user", JSON.stringify(user));
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }

      setAlert({ open: true, message: "Login successful!", severity: "success" });

      if (!user.role) {
        console.error("User role is missing!", user);
        navigate("/unauthorized");
        return;
      }

      const role = user.role.toLowerCase();
      if (role === "admin") navigate("/admin/dashboard");
      else if (role === "support") navigate("/support/dashboard");
      else if (role === "engineer") navigate("/engineer/dashboard");
      else navigate("/unauthorized");

    } catch (error) {
      if (error.response) {
        setAlert({ open: true, message: error.response.data.error || "Invalid email or password", severity: "error" });
      } else {
        setAlert({ open: true, message: "Network error. Please try again.", severity: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

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

              {/* ── LEFT SIDE: Image overlay */}
              <Grid item xs={12} md={6}>
                <ImageOverlay>

                  {/* Feature chips — Small Text (12px) via FeatureChip */}
                  <Box sx={{ position: "absolute", top: 30, left: 30, display: "flex", gap: 1 }}>
                    <FeatureChip icon={<BusinessIcon />} label="Enterprise Ready" />
                    <FeatureChip icon={<SecurityIcon />} label="Secure" />
                  </Box>

                  {/* Hero heading — Page Title (32px) */}
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: "28px", md: "32px" },
                      letterSpacing: "-1px",
                      lineHeight: 1.2,
                      mb: 2,
                      background: `linear-gradient(135deg, #ffffff 0%, ${alpha('#ffffff', 0.9)} 100%)`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Welcome Back
                  </Typography>

                  {/* Subheading — Normal Text (16px) */}
                  <Typography
                    sx={{
                      mb: 4,
                      maxWidth: "380px",
                      color: alpha('#ffffff', 0.8),
                      fontWeight: 400,
                      lineHeight: 1.7,
                      fontSize: "16px",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Access your dashboard, monitor incidents in real-time, and continue managing your team's performance
                  </Typography>

                  {/* Quick stats */}
                  <Box sx={{ display: "flex", gap: 4, mb: 4 }}>
                    <Box sx={{ textAlign: "center" }}>
                      {/* Stat number — Page Title (32px) */}
                      <Typography sx={{
                        fontWeight: 900,
                        fontSize: "32px",
                        background: `linear-gradient(135deg, ${T.cyan}, ${T.white})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        lineHeight: 1,
                      }}>
                        150+
                      </Typography>
                      {/* Stat label — Small Text (12px) */}
                      <Typography sx={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: alpha('#ffffff', 0.7),
                        letterSpacing: "0.3px",
                        textTransform: "uppercase",
                      }}>
                        Daily Active
                      </Typography>
                    </Box>

                    <Divider orientation="vertical" flexItem sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />

                    <Box sx={{ textAlign: "center" }}>
                      {/* Stat number — Page Title (32px) */}
                      <Typography sx={{
                        fontWeight: 900,
                        fontSize: "32px",
                        background: `linear-gradient(135deg, ${T.cyan}, ${T.white})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        lineHeight: 1,
                      }}>
                        24/7
                      </Typography>
                      {/* Stat label — Small Text (12px) */}
                      <Typography sx={{
                        fontSize: "12px",
                        fontWeight: 500,
                        color: alpha('#ffffff', 0.7),
                        letterSpacing: "0.3px",
                        textTransform: "uppercase",
                      }}>
                        Support
                      </Typography>
                    </Box>
                  </Box>

                </ImageOverlay>
              </Grid>

              {/* ── RIGHT SIDE: Login form */}
              <Grid item xs={12} md={6}>
                <Box sx={{ p: { xs: 3, sm: 6 } }}>

                  {/* Brand header */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
                    <Box component="img" src={Logo} alt="IncidentIQ Logo" sx={{ height: 44, width: "auto", objectFit: "contain" }} />
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      {/* Brand name — Section Title (20px) */}
                      <Typography sx={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 800,
                        fontSize: "20px",
                        lineHeight: 1.2,
                        letterSpacing: "-0.4px",
                        color: T.text,
                      }}>
                        Incident
                        <span style={{ color: T.indigo, fontWeight: 900 }}>IQ</span>
                      </Typography>
                      {/* Brand tagline — Small Text (12px) */}
                      <Typography sx={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: 500,
                        fontSize: "12px",
                        letterSpacing: "1px",
                        textTransform: "uppercase",
                        color: T.sub,
                      }}>
                        Sign in to your account
                      </Typography>
                    </Box>
                  </Box>

                  {/* Login Form */}
                  <form onSubmit={handleLogin}>

                    {/* Inputs — label Secondary Text (14px), value Secondary Text (14px) via StyledTextField */}
                    <StyledTextField
                      fullWidth
                      label="Work Email"
                      margin="normal"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: T.sub, fontSize: 20 }} />
                          </InputAdornment>
                        ),
                      }}
                    />

                    <StyledTextField
                      fullWidth
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      margin="normal"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockOpenIcon sx={{ color: T.sub, fontSize: 20 }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              size="small"
                              edge="end"
                              sx={{ color: T.sub }}
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />

                    {/* Remember me + Forgot password */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2, mb: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            sx={{ color: T.borderMd, "&.Mui-checked": { color: T.indigo } }}
                          />
                        }
                        label={
                          // Remember me label — Secondary Text (14px)
                          <Typography sx={{ fontSize: "14px", color: T.sub, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                            Remember me
                          </Typography>
                        }
                      />
                      {/* Forgot password link — Secondary Text (14px) via LinkStyled */}
                      <LinkStyled href="#" onClick={(e) => { e.preventDefault(); navigate("/forgotpassword"); }}>
                        Forgot password?
                      </LinkStyled>
                    </Box>

                    {/* Submit button — Normal Text (16px) via LoginButton */}
                    <LoginButton fullWidth type="submit" disabled={loading}>
                      {loading ? <CircularProgress size={20} color="inherit" /> : "Sign in to dashboard"}
                    </LoginButton>

                    {/* Sign up prompt — Secondary Text (14px) */}
                    <Box sx={{ mt: 3.5, textAlign: "center" }}>
                      <Typography sx={{ fontSize: "14px", color: T.sub, fontFamily: "'DM Sans', sans-serif" }}>
                        Don't have an account?{" "}
                        <LinkStyled
                          href="#"
                          onClick={(e) => { e.preventDefault(); navigate("/register"); }}
                          sx={{ fontWeight: 700 }}
                        >
                          Create free account
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

      {/* Snackbar — Small Text (12px) for alert message */}
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
          sx={{
            width: "100%",
            boxShadow: T.cardShadowHover,
            fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "12px", // Small Text
            borderRadius: "12px",
            border: `1px solid ${T.border}`,
          }}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
};

export default Login;