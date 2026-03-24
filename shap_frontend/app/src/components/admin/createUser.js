import React, { useState } from "react";
import Navbar from "../navbar";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  alpha,
  CircularProgress,
} from "@mui/material";
import LockResetIcon from "@mui/icons-material/LockReset";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import LockIcon from "@mui/icons-material/Lock";
import EngineeringIcon from "@mui/icons-material/Engineering";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import BusinessIcon from "@mui/icons-material/Business";

import { createUser } from "../../services/apiServices";

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
  "&:hover": { backgroundColor: "#333" },
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

const CreateUser = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("support");
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseAlert = () => setAlert({ ...alert, open: false });

  const validatePassword = (password) => {
    const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;
    return regex.test(password);
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

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      setAlert({
        open: true,
        message: "Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character.",
        severity: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const userData = { name, email, password, role };
      await createUser(userData);

      setAlert({ open: true, message: "User created successfully", severity: "success" });

      setName("");
      setEmail("");
      setPassword("");
      setRole("support");

      navigate("/admin/user-list");
    } catch (error) {
      setAlert({ open: true, message: "Failed to create user", severity: "error" });
    } finally {
      setLoading(false);
    }
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

      <Snackbar open={alert.open} autoHideDuration={4000} onClose={handleCloseAlert}>
        <Alert severity={alert.severity} variant="filled">{alert.message}</Alert>
      </Snackbar>

      <Box sx={{ p: 4, maxWidth: "800px", margin: "0 auto", mt: "54px" }}>
        <StyledPaper>

          {/* ── Header ── */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Avatar sx={{ bgcolor: "#1a1a1a", width: 56, height: 56 }}>
              <BusinessIcon />
            </Avatar>
            <Box>
              {/* Section Title → 20px */}
              <Typography fontSize={20} fontWeight={600}>Create User</Typography>
              {/* Secondary Text → 14px */}
              <Typography fontSize={14} color="text.secondary">
                Create Support or Engineer account
              </Typography>
            </Box>
          </Box>

          <form onSubmit={handleCreateUser}>

            {/* Full Name */}
            <StyledTextField
              fullWidth
              label="Full Name"
              margin="normal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon />
                  </InputAdornment>
                ),
                // Normal Text → 16px for input value
                sx: { fontSize: 16 },
              }}
              // Secondary Text → 14px for label
              InputLabelProps={{ style: { fontSize: 14 } }}
            />

            {/* Email */}
            <StyledTextField
              fullWidth
              label="Email"
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
                sx: { fontSize: 16 },
              }}
              InputLabelProps={{ style: { fontSize: 14 } }}
            />

            {/* Role Select */}
            <FormControl fullWidth margin="normal">
              <InputLabel sx={{ fontSize: 14 }}>Role</InputLabel>
              <Select
                value={role}
                label="Role"
                onChange={(e) => setRole(e.target.value)}
                sx={{
                  borderRadius: "12px",
                  backgroundColor: "#f8f9fa",
                  // Normal Text → 16px for selected value
                  fontSize: 16,
                }}
              >
                {/* Secondary Text → 14px for menu items */}
                <MenuItem value="support" sx={{ fontSize: 14 }}>
                  <SupportAgentIcon sx={{ mr: 1 }} />
                  Support
                </MenuItem>
                <MenuItem value="engineer" sx={{ fontSize: 14 }}>
                  <EngineeringIcon sx={{ mr: 1 }} />
                  Engineer
                </MenuItem>
              </Select>
            </FormControl>

            {/* Password */}
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
                    <LockResetIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { fontSize: 16 },
              }}
              InputLabelProps={{ style: { fontSize: 14 } }}
            />

            {/* Password Strength Bar */}
            {password && (
              <Box className="reg-au" sx={{ animationDelay: "0.26s", mt: 1, mb: 2 }}>
                <Box sx={{ display: "flex", gap: "4px", mb: "4px" }}>
                  {[1, 2, 3, 4].map((level) => {
                    const strengthScore = getPasswordStrength(password);
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
                  {/* Small Text → 12px for password strength label */}
                  <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.sub }}>
                    {getPasswordStrength(password) > 0 ? "Password strength: " : ""}
                    <Box component="span" sx={{ fontWeight: 700, color: strengthColors[getPasswordStrength(password)] }}>
                      {strengthLabels[getPasswordStrength(password)]}
                    </Box>
                  </Typography>
                  {/* Small Text → 12px for validation hint */}
                  {!validatePassword(password) && password.length > 0 && (
                    <Typography sx={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: T.red }}>
                      8+ chars, 1 uppercase, 1 number, 1 symbol
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* Submit */}
            <Box sx={{ mt: 3 }}>
              <CreateButton fullWidth type="submit" disabled={loading}>
                {loading
                  ? <CircularProgress size={24} color="inherit" />
                  : "Create User"}
              </CreateButton>
            </Box>

          </form>
        </StyledPaper>
      </Box>
    </Box>
  );
};

export default CreateUser;