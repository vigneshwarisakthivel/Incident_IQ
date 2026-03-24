import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../images/incident.png";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  alpha,
  Chip,
  Divider,
  Badge
} from "@mui/material";
import { styled } from "@mui/material/styles";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssignmentIcon from "@mui/icons-material/Assignment";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import FingerprintIcon from "@mui/icons-material/Fingerprint";
import SecurityIcon from "@mui/icons-material/Security";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { getNotifications, markNotificationRead, deleteNotification, logoutUser, updateUserProfile, getUser } from "../services/apiServices";
import { useState, useEffect } from "react";
import LogoBlock from "./LogoBlock";
// ─────────────────────────────────────────────────────────────────────────────
// TYPOGRAPHY SCALE
// 32px → Page Title
// 20px → Section Title
// 16px → Normal Text
// 14px → Secondary Text
// 12px → Small Text
// ─────────────────────────────────────────────────────────────────────────────

const StyledAppBar = styled(AppBar)({
  background: "#ffffff",
  color: "#1a1a1a",
  boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
  borderBottom: "1px solid rgba(255,255,255,0.3)",
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1300,
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: -50, right: -50,
    width: 200, height: 200,
    borderRadius: "50%",
    background: alpha('#9e9e9e', 0.03),
    zIndex: 0,
  },
  "&::after": {
    content: '""',
    position: "absolute",
    bottom: -70, left: -70,
    width: 250, height: 250,
    borderRadius: "50%",
    background: alpha('#757575', 0.02),
    zIndex: 0,
  },
});

const StyledToolbar = styled(Toolbar)({
  position: "relative",
  zIndex: 1,
  backgroundColor: alpha('#ffffff', 0.9),
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  minHeight: "38px !important",
  "@media (min-width:600px)": {
    minHeight: "38px !important",
  },
  paddingTop: "2px",
  paddingBottom: "2px",
});

const LogoContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
  padding: "6px 12px",
});

// Nav buttons — Secondary Text (14px)
const NavButton = styled(Button)(({ theme, active }) => ({
  color: active ? "#1a1a1a" : "#4a4a4a",
  fontWeight: active ? 600 : 500,
  fontSize: "14px",
  textTransform: "none",
  borderRadius: "8px",
  padding: "2px 10px",
  backgroundColor: active ? alpha('#1a1a1a', 0.04) : "transparent",
  transition: "all 0.2s",
  "&:hover": {
    backgroundColor: alpha('#000000', 0.04),
    transform: "translateY(-1px)",
  },
  "& .MuiButton-startIcon": {
    marginRight: "8px",
    display: "flex",
    alignItems: "center",
    "& > svg": {
      fontSize: "17px",
      opacity: 0.85,
      transition: "all 0.2s ease",
    },
  },
  "&:hover .MuiButton-startIcon svg": {
    opacity: 1,
    transform: "scale(1.05)",
  },
}));

const IconButtonStyled = styled(IconButton)({
  borderRadius: "8px",
  padding: "4px",
  backgroundColor: "#f9fafb",
  border: "1px solid #eee",
  transition: "all 0.2s ease",
  "&:hover": {
    backgroundColor: "#f3f4f6",
    borderColor: "#ddd",
  },
  "& .MuiSvgIcon-root": {
    fontSize: "18px",
    color: "#555",
  },
});

const StyledAvatar = styled(Avatar)({
  background: "#1a1a1a",
  width: 28,
  height: 28,
  transition: "all 0.2s",
  border: "2px solid transparent",
  "&:hover": {
    transform: "scale(1.05)",
    borderColor: "#666",
  },
});

const StyledMenu = styled(Menu)({
  "& .MuiPaper-root": {
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
    border: "1px solid #eee",
    minWidth: "220px",
    marginTop: "4px",
    overflow: "hidden",
    position: "relative",
    "&::before": {
      content: '""',
      position: "absolute",
      top: -30, right: -30,
      width: 100, height: 100,
      borderRadius: "50%",
      background: alpha('#9e9e9e', 0.03),
      zIndex: 0,
    },
  },
});

const NotificationMenu = styled(Menu)({
  "& .MuiPaper-root": {
    borderRadius: "12px",
    boxShadow: "0 15px 35px rgba(0,0,0,0.15)",
    border: "1px solid #eee",
    minWidth: "380px",
    maxWidth: "480px",
    marginTop: "4px",
  },
});

// Menu items — Secondary Text (14px)
const StyledMenuItem = styled(MenuItem)({
  padding: "10px 16px",
  fontSize: "14px",
  position: "relative",
  zIndex: 1,
  gap: "12px",
  minHeight: "40px",
  borderRadius: "8px",
  margin: "2px 6px",
  transition: "all 0.2s",
  "&:hover": {
    backgroundColor: alpha('#6366f1', 0.08),
    transform: "translateX(4px)",
  },
});

const SecurityBadge = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  padding: "2px 8px",
  backgroundColor: "#f8f9fa",
  borderRadius: "16px",
  border: "1px solid #e0e0e0",
  marginLeft: "6px",
  "& .MuiSvgIcon-root": {
    fontSize: "12px",
  },
  "& .MuiTypography-root": {
    fontSize: "12px", // Small Text
  },
});

const NavContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  flex: 1,
  gap: "4px",
});

const Navbar = () => {
  const backendURL = "https://incidentiq-backend.onrender.com/api";
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [socket, setSocket] = useState(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = React.useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userRole, setUserRole] = useState("");
  const [profile, setProfile] = useState({
    profile_image: null,
    name: "",
    email: "",
    role: "",
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
    indigo:  "#6366f1", indigoL: "#eef2ff",
  };

  const currentPath = window.location.pathname;

  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleNotificationOpen = (event) => setNotificationAnchor(event.currentTarget);
  const handleClose = () => { setAnchorEl(null); setNotificationAnchor(null); };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();
      navigate("/login");
    }
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const storedUser = sessionStorage.getItem("user") || localStorage.getItem("user");
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        if (!user.id) { console.error("User ID is missing from storage"); return; }
        const res = await getUser(user.id);
        const fullUser = res.data;
        setProfile({
          name: fullUser.name,
          email: fullUser.email,
          role: fullUser.role,
          profile_image: fullUser.profile_image
            ? fullUser.profile_image.startsWith("http")
              ? fullUser.profile_image
              : `${backendURL}${fullUser.profile_image}`
            : null,
        });
        setUserRole(fullUser.role);
        if (sessionStorage.getItem("user")) {
          sessionStorage.setItem("user", JSON.stringify(fullUser));
        } else if (localStorage.getItem("user")) {
          localStorage.setItem("user", JSON.stringify(fullUser));
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };
    fetchUserProfile();
  }, []);
useEffect(() => {

  const storedUser =
    sessionStorage.getItem("user") || localStorage.getItem("user");

  if (!storedUser) return;

  const user = JSON.parse(storedUser);

  const token =
    sessionStorage.getItem("token") || localStorage.getItem("token");

  if (!token) {
    console.log("Token not found");
    return;
  }
const ws = new WebSocket(
  `wss://incidentiq-backend.onrender.com/ws/notifications/?token=${token}`
);
  ws.onopen = () => {
    console.log("WebSocket connected");
  };

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  console.log("REALTIME NOTIFICATION:", data);

  if (data.type === "new_notification") {
    const newNotification = data.notification;

    setNotifications(prev => [newNotification, ...prev]);

    setUnreadCount(prev => prev + 1);
  }
};

  ws.onerror = (error) => {
    console.log("WebSocket error:", error);
  };

  return () => ws.close();

}, []);
  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const fileInputRef = React.useRef(null);

  const handleDeleteNotification = async (notificationId, event) => {
    event.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const deleted = notifications.find(n => n.id === notificationId);
        return deleted?.is_read ? prev : prev - 1;
      });
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const handleProfileImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const res = await updateUserProfile(file);
   
      setProfile((prev) => ({
        ...prev,
        profile_image: res.data.profile_image.startsWith("http")
          ? res.data.profile_image
          : `${backendURL}${res.data.profile_image}`,
      }));
    } catch (err) {
      console.error("Error updating profile image:", err.response?.data || err);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await markNotificationRead(notification.id);
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => prev - 1);
      } catch (err) {
        console.error("Error marking notification as read:", err);
      }
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.is_read === b.is_read) return new Date(b.created_at) - new Date(a.created_at);
    return a.is_read ? 1 : -1;
  });

  const visibleNotifications = showAllNotifications
    ? sortedNotifications
    : sortedNotifications.slice(0, 5);

  const renderNavMenus = () => {
    switch (userRole?.toLowerCase()) {

      case "admin":
        return (
          <>
            <NavButton startIcon={<DashboardIcon />} onClick={() => navigate("/admin/dashboard")} active={currentPath === "/admin/dashboard" ? 1 : 0}>Dashboard</NavButton>
            <NavButton startIcon={<AddCircleOutlineIcon />} onClick={() => navigate("/admin/create-user")} active={currentPath === "/admin/create-user" ? 1 : 0}>Create User</NavButton>
            <NavButton startIcon={<DashboardIcon />} onClick={() => navigate("/admin/user-list")} active={currentPath === "/admin/user-list" ? 1 : 0}>User List</NavButton>
            <NavButton startIcon={<AssignmentIcon />} onClick={() => navigate("/admin/incidents")} active={currentPath === "/admin/incidents" ? 1 : 0}>Incidents</NavButton>
            <NavButton startIcon={<MenuBookIcon />} onClick={() => navigate("/admin/knowledgebase")} active={currentPath === "/admin/knowledgebase" ? 1 : 0}>Knowledge Base</NavButton>
          </>
        );

      case "engineer":
        return (
          <>
            <NavButton startIcon={<DashboardIcon />} onClick={() => navigate("/engineer/dashboard")} active={currentPath === "/engineer/dashboard" ? 1 : 0}>Dashboard</NavButton>
            <NavButton startIcon={<AssignmentIcon />} onClick={() => navigate("/engineer/assigned-incidents")} active={currentPath === "/engineer/assigned-incidents" ? 1 : 0}>Assigned Incidents</NavButton>
            <NavButton startIcon={<MenuBookIcon />} onClick={() => navigate("/engineer/knowledgebase")} active={currentPath === "/engineer/knowledgebase" ? 1 : 0}>Knowledge Base</NavButton>
          </>
        );

      case "support":
        return (
          <>
            <NavButton startIcon={<DashboardIcon />} onClick={() => navigate("/support/dashboard")} active={currentPath === "/support/dashboard" ? 1 : 0}>Dashboard</NavButton>
            <NavButton startIcon={<AddCircleOutlineIcon />} onClick={() => navigate("/support/create-incident")} active={currentPath === "/support/create-incident" ? 1 : 0}>Create Incident</NavButton>
            <NavButton startIcon={<AssignmentIcon />} onClick={() => navigate("/support/my-incident")} active={currentPath === "/support/my-incident" ? 1 : 0}>My Incidents</NavButton>
            <NavButton startIcon={<MenuBookIcon />} onClick={() => navigate("/support/knowledgebase")} active={currentPath === "/support/knowledgebase" ? 1 : 0}>Knowledge Base</NavButton>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <StyledAppBar position="fixed">
      <StyledToolbar sx={{ px: { xs: 2, md: 3 } }}>

        {/* ── Left: Logo + Nav */}
        <NavContainer>
<LogoBlock />

          {/* Nav buttons — Secondary Text (14px) via NavButton */}
          <Box sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, alignItems: "center" }}>
            {renderNavMenus()}
          </Box>
        </NavContainer>

        {/* ── Right: Notifications + Profile */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>

          {/* Notifications bell */}
          <IconButtonStyled onClick={handleNotificationOpen}>
            <Badge
              badgeContent={unreadCount}
              color="error"
              sx={{ "& .MuiBadge-badge": { fontSize: "12px", height: 16, minWidth: 16 } }}
            >
              <NotificationsNoneIcon sx={{ color: "#4a4a4a" }} />
            </Badge>
          </IconButtonStyled>

          {/* User profile area */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Box sx={{ display: { xs: "none", lg: "block" }, textAlign: "right" }}>
              {/* Profile name — Secondary Text (14px) */}
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#1a1a1a", fontSize: "14px", lineHeight: 1.2, mb: 0 }}>
                {profile.name}
              </Typography>
              {/* Profile role — Small Text (12px) */}
              <Typography variant="caption" sx={{ color: "#666", fontSize: "12px", lineHeight: 1.2, mb: 0 }}>
                {profile.role}
              </Typography>
            </Box>

            <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
              <StyledAvatar>
                {profile.profile_image ? (
                  <img src={profile.profile_image} alt="profile" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                ) : (
                  <AccountCircleIcon sx={{ fontSize: 18 }} />
                )}
              </StyledAvatar>
            </IconButton>
          </Box>

          {/* ── Profile dropdown menu */}
          <StyledMenu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            PaperProps={{
              sx: {
                minWidth: "200px", maxWidth: "220px",
                borderRadius: "14px",
                boxShadow: "0 10px 30px -5px rgba(0,0,0,0.2)",
                overflow: "visible", position: "relative", mt: 0.5,
                '&::before': {
                  content: '""', position: "absolute",
                  top: -6, right: 16, width: 12, height: 12,
                  backgroundColor: "#ffffff", transform: "rotate(45deg)",
                  borderTop: "1px solid #eee", borderLeft: "1px solid #eee", zIndex: 0,
                },
              }
            }}
          >
            {/* Profile card header */}
            <Box sx={{
              p: 1.5,
              background: "linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)",
              borderBottom: "1px solid #eee",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 1,
            }}>
              <Box sx={{ position: "relative", display: "inline-block" }}>
                <StyledAvatar onClick={() => fileInputRef.current?.click()} sx={{ width: 70, height: 70 }}>
                  {profile.profile_image ? (
                    <img src={profile.profile_image} alt="profile" style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
                  ) : (
                    <AccountCircleIcon sx={{ fontSize: 50 }} />
                  )}
                </StyledAvatar>
                <IconButton
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  sx={{ position: "absolute", bottom: 0, right: 0, background: "#fff", borderRadius: "50%", p: 0.5 }}
                >
                  <EditIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>

              <input type="file" accept="image/*" style={{ display: "none" }} ref={fileInputRef} onChange={handleProfileImageChange} />

              <Box sx={{ textAlign: "center" }}>
                {/* Menu profile name — Secondary Text (14px) */}
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1a1a1a", fontSize: "14px", mb: 0.25 }}>
                  {profile.name}
                </Typography>
                {/* Menu profile email — Small Text (12px) */}
                <Typography variant="caption" sx={{ color: "#666", fontSize: "12px", display: "block", mb: 0.5 }}>
                  {profile.email}
                </Typography>
                {/* Role badge — Small Text (12px) */}
                <Chip
                  label={profile.role}
                  size="small"
                  sx={{
                    bgcolor: alpha('#1a1a1a', 0.08),
                    color: "#1a1a1a",
                    borderRadius: "10px",
                    height: "18px",
                    fontSize: "12px",
                    fontWeight: 500,
                    '& .MuiChip-label': { px: 1 },
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 0.25 }} />

            {/* Logout */}
            <Box sx={{ p: 0.5 }}>
              <StyledMenuItem onClick={handleLogout} sx={{
                py: 0.75, px: 1.5, borderRadius: "8px",
                fontSize: "14px", // Secondary Text
                gap: 1.5, color: "#d32f2f",
                '&:hover': { bgcolor: alpha('#d32f2f', 0.04) },
              }}>
                <LogoutIcon sx={{ fontSize: 16, color: "#d32f2f" }} />
                Sign Out
              </StyledMenuItem>

              {/* Security note — Small Text (12px) */}
              <Box sx={{
                mt: 1, px: 1.5, py: 0.75,
                display: "flex", alignItems: "center", gap: 1, justifyContent: "center",
                bgcolor: alpha('#f8f9fa', 0.8), borderRadius: "6px",
              }}>
                <SecurityIcon sx={{ fontSize: 12, color: "#999" }} />
                <Typography variant="caption" sx={{ color: "#999", fontSize: "12px" }}>
                  Secured session
                </Typography>
              </Box>
            </Box>
          </StyledMenu>

          {/* ── Notifications dropdown menu */}
          <NotificationMenu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={handleClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {/* Notifications header — Secondary Text (14px) */}
            <Box sx={{ p: 1, backgroundColor: "#f8f9fa", borderBottom: "1px solid #eee" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "#1a1a1a", fontSize: "14px" }}>
                Notifications
              </Typography>
            </Box>

            {notifications.length === 0 && (
              <StyledMenuItem>
                {/* Empty state — Small Text (12px) */}
                <Typography variant="body2" sx={{ fontSize: "12px", color: "#666" }}>
                  No notifications
                </Typography>
              </StyledMenuItem>
            )}

            <Box sx={{ maxHeight: 320, overflowY: "auto" }}>
              {visibleNotifications.map((notification) => (
                <Box
                  key={notification.id}
                  sx={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    bgcolor: notification.is_read ? "transparent" : alpha("#2196f3", 0.08),
                    '&:hover': { bgcolor: alpha("#000000", 0.04) },
                  }}
                >
                  <StyledMenuItem
                    onClick={() => handleNotificationClick(notification)}
                    sx={{ py: 0.6, px: 1.2, flex: 1, bgcolor: "transparent", '&:hover': { bgcolor: "transparent" } }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <Box>
                        {/* Notification message — Secondary Text (14px) */}
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: "14px" }}>
                          {notification.message}
                        </Typography>
                        {/* Notification timestamp — Small Text (12px) */}
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: "12px" }}>
                          {new Date(notification.created_at).toLocaleString()}
                        </Typography>
                      </Box>
                      {!notification.is_read && (
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#f44336", ml: 1 }} />
                      )}
                    </Box>
                  </StyledMenuItem>

                  <IconButton
                    size="small"
                    onClick={(e) => handleDeleteNotification(notification.id, e)}
                    sx={{ mr: 1, color: '#999', '&:hover': { color: '#f44336', backgroundColor: alpha('#f44336', 0.08) } }}
                  >
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}

              {notifications.length > 5 && !showAllNotifications && (
                <>
                  <Divider sx={{ my: 0.5 }} />
                  <StyledMenuItem onClick={() => setShowAllNotifications(true)} sx={{ justifyContent: "center" }}>
                    {/* Show more — Secondary Text (14px) */}
                    <Typography variant="body2" sx={{ fontSize: "14px", color: "#1976d2" }}>
                      Show More
                    </Typography>
                  </StyledMenuItem>
                </>
              )}

              {showAllNotifications && notifications.length > 5 && (
                <StyledMenuItem onClick={() => setShowAllNotifications(false)} sx={{ justifyContent: "center" }}>
                  {/* Show less — Secondary Text (14px) */}
                  <Typography variant="body2" sx={{ fontSize: "14px", color: "#1976d2" }}>
                    Show Less
                  </Typography>
                </StyledMenuItem>
              )}
            </Box>
          </NotificationMenu>

        </Box>
      </StyledToolbar>
    </StyledAppBar>
  );
};

export default Navbar;