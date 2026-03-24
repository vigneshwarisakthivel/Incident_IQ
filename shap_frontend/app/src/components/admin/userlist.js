import React, { useEffect, useState } from "react";
import Navbar from "../navbar";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";

import { TextField, FormControl, InputLabel, Select, MenuItem, Button } from "@mui/material";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Table,
  TableBody,
  TableCell,
  Tooltip,
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
} from "@mui/material";

import { styled } from "@mui/material/styles";
import BusinessIcon from "@mui/icons-material/Business";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import EngineeringIcon from "@mui/icons-material/Engineering";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

import { getUsers, deleteUser, updateUserStatus } from "../../services/apiServices";

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

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const navigate = useNavigate();
  const [alert, setAlert] = useState({ open: false, message: "", severity: "success" });
  const [roleFilter, setRoleFilter] = useState("ALL");

  const handleCloseAlert = () => setAlert({ ...alert, open: false });
  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (error) {
      setAlert({ open: true, message: "Failed to fetch users", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    try {
      await deleteUser(id);
      setUsers(users.filter((user) => user.id !== id));
      setAlert({ open: true, message: "User deleted successfully", severity: "success" });
    } catch (error) {
      setAlert({ open: true, message: "Failed to delete user", severity: "error" });
    }
  };

  const formatText = (text) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case "ADMIN":
        return { bgcolor: "#f3e8ff", color: "#7c3aed", icon: <BusinessIcon fontSize="small" /> };
      case "ENGINEER":
        return { bgcolor: "#eff6ff", color: "#2563eb", icon: <EngineeringIcon fontSize="small" /> };
      case "SUPPORT":
        return { bgcolor: "#fff7ed", color: "#ea580c", icon: <SupportAgentIcon fontSize="small" /> };
      default:
        return { bgcolor: "#f3f4f6", color: "#374151", icon: null };
    }
  };

  const toggleStatus = async (user) => {
    try {
      const updatedStatus = user.status?.toLowerCase() === "active" ? "INACTIVE" : "ACTIVE";
      await updateUserStatus(user.id, updatedStatus);
      setUsers(users.map((u) => (u.id === user.id ? { ...u, status: updatedStatus } : u)));
      setAlert({ open: true, message: "User status updated", severity: "success" });
    } catch (error) {
      setAlert({ open: true, message: "Failed to update status", severity: "error" });
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", background: "#f0f2f5", position: "relative", overflow: "hidden" }}>
      <Box sx={{ position: "fixed", top: -50, right: -50, width: 300, height: 300, borderRadius: "50%", background: alpha(T.cyan, 0.03), zIndex: 0 }} />
      <Box sx={{ position: "fixed", bottom: -70, left: -70, width: 400, height: 400, borderRadius: "50%", background: alpha(T.teal, 0.02), zIndex: 0 }} />
      <Box sx={{ position: "fixed", top: "20%", left: "10%", width: 200, height: 200, background: alpha(T.violet, 0.01), transform: "rotate(45deg)", zIndex: 0 }} />

      <Navbar />

      <Snackbar open={alert.open} autoHideDuration={4000} onClose={handleCloseAlert}>
        <Alert severity={alert.severity} variant="filled">{alert.message}</Alert>
      </Snackbar>

      <Box sx={{ p: 4, maxWidth: "1000px", margin: "0 auto", mt: "54px" }}>
        <StyledPaper>

          {/* ── Header ── */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar sx={{ bgcolor: "#111827", width: 48, height: 48 }}><BusinessIcon /></Avatar>
              <Box>
                {/* Section Title → 20px */}
                <Typography fontSize={20} fontWeight={600}>User Management</Typography>
                {/* Secondary Text → 14px */}
                <Typography fontSize={14} color="text.secondary">Manage support and engineer accounts</Typography>
              </Box>
            </Box>

            {/* Small Text → 12px for total count */}
            <Typography fontSize={12} sx={{ bgcolor: "#f3f4f6", px: 2, py: 1, borderRadius: "8px", fontWeight: 500 }}>
              Total Users: {users.filter(user => roleFilter === "ALL" || user.role.toUpperCase() === roleFilter).length}
            </Typography>
          </Box>

          {/* ── Filter Bar ── */}
          <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
            {/* Search */}
            <TextField
              size="small"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              sx={{
                width: 220,
                "& .MuiInputBase-root": { height: 34, fontSize: "14px", borderRadius: "8px" },
              }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, fontSize: 18, color: "text.secondary" }} />,
              }}
            />

            {/* Role Filter */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: "14px" }}>Role</InputLabel>
              <Select
                value={roleFilter}
                label="Role"
                onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
                sx={{ fontSize: "14px", height: 34, "& .MuiSelect-select": { fontSize: "14px", paddingTop: 4, paddingBottom: 4 } }}
              >
                <MenuItem value="ALL" sx={{ fontSize: "14px" }}>All</MenuItem>
                <MenuItem value="ADMIN" sx={{ fontSize: "14px" }}>Admin</MenuItem>
                <MenuItem value="ENGINEER" sx={{ fontSize: "14px" }}>Engineer</MenuItem>
                <MenuItem value="SUPPORT" sx={{ fontSize: "14px" }}>Support</MenuItem>
              </Select>
            </FormControl>

            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel sx={{ fontSize: "14px" }}>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                sx={{ fontSize: "14px", height: 34, "& .MuiSelect-select": { fontSize: "14px", paddingTop: 4, paddingBottom: 4 } }}
              >
                <MenuItem value="ALL" sx={{ fontSize: "14px" }}>All</MenuItem>
                <MenuItem value="ACTIVE" sx={{ fontSize: "14px" }}>Active</MenuItem>
                <MenuItem value="INACTIVE" sx={{ fontSize: "14px" }}>Inactive</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate("/admin/create-user")}
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
              Create User
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
                    {/* Secondary Text → 14px for table headers */}
                    <TableCell sx={{ fontWeight: 600, fontSize: 14, width: "15%" }}>User</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 14, width: "15%" }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 14, width: "15%" }}>Role</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 14, width: "15%" }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, fontSize: 14, width: "15%" }}>Actions</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {users
                    .filter(user =>
                      (roleFilter === "ALL" || user.role.toUpperCase() === roleFilter) &&
                      (statusFilter === "ALL" || user.status?.toUpperCase() === statusFilter) &&
                      (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       user.email?.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map(user => (
                      <TableRow key={user.id} sx={{ "&:hover": { backgroundColor: "#f9fafb" } }}>
                        {/* User name — Small Text (12px) */}
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Tooltip title={user.name}>
                              <Typography
                                fontSize={12}
                                fontWeight={500}
                                sx={{ maxWidth: "150px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                              >
                                {user.name}
                              </Typography>
                            </Tooltip>
                          </Box>
                        </TableCell>

                        {/* Email — Small Text (12px) */}
                        <TableCell>
                          <Typography fontSize={12}>{user.email}</Typography>
                        </TableCell>

                        {/* Role badge — Small Text (12px) */}
                        <TableCell>
                          {(() => {
                            const roleStyle = getRoleStyle(user.role);
                            return (
                              <Box sx={{
                                display: "inline-flex", alignItems: "center", gap: 1,
                                px: 1.5, py: 0.5, borderRadius: "8px",
                                bgcolor: roleStyle.bgcolor, color: roleStyle.color,
                                fontWeight: 500, fontSize: 12,
                              }}>
                                {roleStyle.icon}{formatText(user.role)}
                              </Box>
                            );
                          })()}
                        </TableCell>

                        {/* Status badge — Small Text (12px) */}
                        <TableCell>
                          <Box sx={{
                            px: 1.5, py: 0.4, borderRadius: "8px",
                            fontSize: 12, fontWeight: 500, display: "inline-block",
                            bgcolor: user.status?.toLowerCase() === "active" ? "#ecfdf5" : "#fef2f2",
                            color: user.status?.toLowerCase() === "active" ? "#059669" : "#dc2626",
                          }}>
                            {formatText(user.status)}
                          </Box>
                        </TableCell>

                        <TableCell align="right">
                          <IconButton
                            onClick={() => toggleStatus(user)}
                            sx={{ color: user.status?.toLowerCase() === "active" ? "#059669" : "#6b7280", "&:hover": { backgroundColor: "#ecfdf5" } }}
                          >
                            {user.status?.toLowerCase() === "active" ? <ToggleOnIcon /> : <ToggleOffIcon />}
                          </IconButton>
                          <IconButton
                            onClick={() => handleDelete(user.id)}
                            sx={{ color: "#ef4444", "&:hover": { backgroundColor: "#fee2e2" } }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component="div"
            count={users.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25]}
            sx={{ borderTop: "1px solid #e5e7eb", mt: 2, fontSize: 12 }}
          />
        </StyledPaper>
      </Box>
    </Box>
  );
};

export default UserList;