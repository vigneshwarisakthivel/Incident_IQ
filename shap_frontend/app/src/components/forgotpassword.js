import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import { styled, alpha } from "@mui/material/styles";
import LockResetIcon from "@mui/icons-material/LockReset";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import BusinessIcon from "@mui/icons-material/Business";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SecurityIcon from "@mui/icons-material/Security";
import Logo from "../images/incident.png";
import GroupsIcon from "@mui/icons-material/Groups";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import WelcomeImage from "../images/office.jpg";
import { sendOTP, verifyOTP, resetPassword } from "../services/apiServices";

// ─── Typography Scale ────────────────────────────────────────────────────────
// 32px → Page Title
// 20px → Section Title
// 16px → Normal Text
// 14px → Secondary Text
// 12px → Small Text

const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: "24px",
  overflow: "hidden",
  backgroundColor: "#ffffff",
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
}));

const ImageOverlay = styled(Box)(({ theme }) => ({
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

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#f8f9fa",
    "& .MuiInputBase-input": {
      // Normal Text → 16px for input value
      fontSize: "16px",
    },
  },
  "& .MuiInputLabel-root": {
    // Secondary Text → 14px for label
    fontSize: "14px",
    fontWeight: 500,
    backgroundColor: "#ffffff",
    padding: "0 6px",
  },
  "& .MuiFormHelperText-root": {
    // Small Text → 12px for helper/error text
    fontSize: "12px",
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#e5e7eb",
  },
});

const ForgotButton = styled(Button)({
  borderRadius: "12px",
  padding: "12px",
  backgroundColor: "#1a1a1a",
  color: "#fff",
  fontWeight: 600,
  // Secondary Text → 14px for button
  fontSize: "14px",
  textTransform: "none",
  "&:hover": { backgroundColor: "#333" },
  "&:disabled": { backgroundColor: "#ccc" },
});

const FeatureChip = styled(Chip)({
  backgroundColor: alpha("#ffffff", 0.15),
  color: "white",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: "20px",
  "& .MuiChip-icon": { color: "white" },
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

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });

  const [errors, setErrors] = useState({
    email: "", otp: "", password: "", confirmPassword: "",
  });

  const steps = ["Verify Email", "Enter OTP", "Reset Password"];

  const handleCloseAlert = () => setAlert({ ...alert, open: false });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = (p) => /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/.test(p);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) { setErrors({ ...errors, email: "Email is required" }); return; }
    if (!validateEmail(email)) { setErrors({ ...errors, email: "Please enter a valid email address" }); return; }
    setLoading(true);
    try {
      const response = await sendOTP({ email });
      setAlert({ open: true, message: response.data.message || "OTP sent successfully!", severity: "success" });
      setActiveStep(1);
    } catch (error) {
      setAlert({ open: true, message: error.response?.data?.message || "Failed to send OTP. Please try again.", severity: "error" });
    } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) { setErrors({ ...errors, otp: "Please enter complete 6-digit OTP" }); return; }
    setLoading(true);
    try {
      const response = await verifyOTP({ email, otp: otpString });
      setAlert({ open: true, message: response.data.message || "OTP verified successfully!", severity: "success" });
      setActiveStep(2);
    } catch (error) {
      setAlert({ open: true, message: error.response?.data?.message || "Invalid OTP. Please try again.", severity: "error" });
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) { setErrors({ ...errors, password: "Password is required" }); return; }
    if (!validatePassword(newPassword)) { setErrors({ ...errors, password: "Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number" }); return; }
    if (!confirmPassword) { setErrors({ ...errors, confirmPassword: "Please confirm your password" }); return; }
    if (newPassword !== confirmPassword) { setErrors({ ...errors, confirmPassword: "Passwords do not match" }); return; }
    setLoading(true);
    try {
      const otpString = otp.join("");
      const response = await resetPassword({ email, otp: otpString, new_password: newPassword, confirm_password: confirmPassword });
      setAlert({ open: true, message: response.data.message || "Password reset successfully!", severity: "success" });
      setTimeout(() => { navigate("/login"); }, 2000);
    } catch (error) {
      setAlert({ open: true, message: error.response?.data?.message || "Failed to reset password. Please try again.", severity: "error" });
    } finally { setLoading(false); }
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
    if (errors.otp) setErrors({ ...errors, otp: "" });
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8)           score++;
    if (/[A-Z]/.test(password))         score++;
    if (/\d/.test(password))            score++;
    if (/[@$!%*?&.#]/.test(password))   score++;
    return score;
  };

  const strengthColors = ["#e8edf5", T.red, T.amber, T.amber, T.green];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <form onSubmit={handleSendOTP}>
            <StyledTextField
              fullWidth
              label="Work Email"
              margin="dense"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: "" }); }}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />
            {/* Secondary Text → 14px for hint */}
            <Typography fontSize={14} color="text.secondary" sx={{ mb: 3 }}>
              We'll send a 6-digit verification code to your email address.
            </Typography>
            <ForgotButton fullWidth type="submit" disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : "Send OTP"}
            </ForgotButton>
          </form>
        );

      case 1:
        return (
          <form onSubmit={handleVerifyOTP}>
            {/* Secondary Text → 14px for instruction */}
            <Typography fontSize={14} color="text.secondary" sx={{ mb: 2 }}>
              Enter the 6-digit code sent to <strong>{email}</strong>
            </Typography>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mb: 3 }}>
              {otp.map((digit, index) => (
                <TextField
                  key={index}
                  id={`otp-${index}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  inputProps={{
                    maxLength: 1,
                    style: {
                      textAlign: "center",
                      fontSize: "1.2rem",
                      fontWeight: 600,
                      width: "40px",
                      height: "50px",
                      padding: 0,
                    },
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", backgroundColor: "#f8f9fa" } }}
                />
              ))}
            </Box>
            {errors.otp && (
              <Typography color="error" variant="caption" sx={{ display: "block", textAlign: "center", mb: 2 }}>
                {errors.otp}
              </Typography>
            )}
            <ForgotButton fullWidth type="submit" disabled={loading} sx={{ mb: 2 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : "Verify OTP"}
            </ForgotButton>
            <Box sx={{ textAlign: "center" }}>
              <Link
                href="#"
                sx={{ color: "#1a1a1a", textDecoration: "none", fontWeight: 500, fontSize: 14, "&:hover": { textDecoration: "underline" } }}
                onClick={(e) => { e.preventDefault(); handleSendOTP(e); }}
              >
                Resend OTP
              </Link>
            </Box>
          </form>
        );

      case 2:
        return (
          <form onSubmit={handleResetPassword}>
            <StyledTextField
              fullWidth
              label="New Password"
              type={showPassword ? "text" : "password"}
              margin="dense"
              value={newPassword}
              onChange={(e) => { setNewPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: "" }); }}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKeyIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" sx={{ color: T.sub }}>
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <StyledTextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              margin="dense"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" }); }}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <VpnKeyIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small" sx={{ color: "black", p: 0 }}>
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            {/* Password Strength Bar */}
            {newPassword && (
              <Box className="reg-au" sx={{ animationDelay: "0.26s", mt: -0.5, mb: 2 }}>
                <Box sx={{ display: "flex", gap: "4px", mb: "4px" }}>
                  {[1, 2, 3, 4].map((level) => {
                    const strengthScore = getPasswordStrength(newPassword);
                    return (
                      <Box key={level} sx={{
                        height: 3, flex: 1, borderRadius: 2,
                        bgcolor: level <= strengthScore ? strengthColors[strengthScore] : T.border,
                        transition: "background-color .3s ease",
                      }} />
                    );
                  })}
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {/* Small Text → 12px for strength label */}
                  <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.sub }}>
                    {getPasswordStrength(newPassword) > 0 ? "Password strength: " : ""}
                    <Box component="span" sx={{ fontWeight: 700, color: strengthColors[getPasswordStrength(newPassword)] }}>
                      {strengthLabels[getPasswordStrength(newPassword)]}
                    </Box>
                  </Typography>
                  {/* Small Text → 12px for validation hint */}
                  {!validatePassword(newPassword) && newPassword.length > 0 && (
                    <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.red }}>
                      8+ chars, 1 uppercase, 1 number, 1 symbol
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            <ForgotButton fullWidth type="submit" disabled={loading}>
              {loading ? <CircularProgress size={24} color="inherit" /> : "Reset Password"}
            </ForgotButton>
          </form>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f0f2f5",
      position: "relative",
      overflow: "hidden",
    }}>
      <Box sx={{ position: "fixed", top: -50, right: -50, width: 300, height: 300, borderRadius: "50%", background: "rgba(0,0,0,0.02)", zIndex: 0 }} />
      <Box sx={{ position: "fixed", bottom: -70, left: -70, width: 400, height: 400, borderRadius: "50%", background: "rgba(0,0,0,0.015)", zIndex: 0 }} />
      <Box sx={{ position: "fixed", top: "20%", left: "10%", width: 200, height: 200, background: "rgba(0,0,0,0.01)", transform: "rotate(45deg)", zIndex: 0 }} />

      <Container maxWidth="lg" sx={{ position: "relative", zIndex: 1 }}>
        <StyledPaper elevation={0}>
          <Grid container>

            {/* LEFT SIDE — IMAGE */}
            <Grid item xs={12} md={6}>
              <ImageOverlay>
                <Box sx={{ position: "absolute", top: 30, left: 30, display: "flex", gap: 1 }}>
                  <FeatureChip icon={<BusinessIcon />} label="Enterprise Ready" size="small" />
                  <FeatureChip icon={<SecurityIcon />} label="Secure" size="small" />
                </Box>

                <Typography variant="h4" sx={{ fontWeight: 600, mb: 3.5, letterSpacing: "-0.5px", fontSize: { xs: "1.8rem", md: "2.2rem" } }}>
                  Reset Password
                </Typography>

                <Typography variant="body1" sx={{ mb: 4, maxWidth: "380px", opacity: 0.9, fontWeight: 400, lineHeight: 1.6, fontSize: "0.95rem" }}>
                  Don't worry! It happens. Reset your password in three simple steps.
                </Typography>

                {/* Steps — Small Text (12px) on dark background */}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 4, mb: 6, width: "100%" }}>
                  {[
                    "Verify your email address",
                    "Enter the OTP sent to your email",
                    "Create a new strong password",
                  ].map((text, i) => (
                    <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar sx={{ bgcolor: alpha("#ffffff", 0.2), width: 32, height: 32 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{i + 1}</Typography>
                      </Avatar>
                      {/* Small Text → 12px — kept since it's on a dark overlay image */}
                      <Typography variant="body2" sx={{ fontSize: 12, opacity: 0.95 }}>
                        {text}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </ImageOverlay>
            </Grid>

            {/* RIGHT SIDE — FORM */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: { xs: 3, sm: 5 } }}>

                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
                  <Box component="img" src={Logo} alt="IncidentIQ Logo" sx={{ height: 44, width: "auto", objectFit: "contain" }} />
                  <Box sx={{ display: "flex", flexDirection: "column" }}>
                    {/* Page Title → 32px (via fontSize rem) */}
                    <Typography sx={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 800,
                      fontSize: "1.5rem",
                      letterSpacing: "-0.8px",
                      color: T.text,
                      lineHeight: 1.15,
                    }}>
                      Forgot Password?
                    </Typography>
                    {/* Small Text → 12px for tagline */}
                    <Typography sx={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 500,
                      fontSize: 12,
                      letterSpacing: "1px",
                      textTransform: "uppercase",
                      color: T.sub,
                    }}>
                      Enter your email to reset your password
                    </Typography>
                  </Box>
                </Box>

                {/* Stepper — Small Text (12px) for step labels */}
                <Stepper
                  activeStep={activeStep}
                  sx={{
                    mb: 4,
                    "& .MuiStepLabel-label": { fontSize: "12px" },
                  }}
                >
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {/* Step Content */}
                {renderStepContent()}

                {/* Back to Login */}
                <Box sx={{ mt: 3, textAlign: "center" }}>
                  {/* Small Text → 12px for footer note */}
                  <Typography fontSize={12} color="text.secondary">
                    Remember your password?{" "}
                    <Link
                      href="#"
                      sx={{ color: "#1a1a1a", fontWeight: 600, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                      onClick={(e) => { e.preventDefault(); navigate("/login"); }}
                    >
                      Back to Login
                    </Link>
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </StyledPaper>
      </Container>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: "100%", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", fontWeight: 500 }}
          variant="filled"
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ForgotPassword;