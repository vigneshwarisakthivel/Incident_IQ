import React from "react";
import { Box, Typography } from "@mui/material";
import Logo from "../images/incident.png";

const LogoBlock = ({
  onClick,
  height = 36,
  nameFontSize = "20px",
  taglineFontSize = "10px",
  nameColor = "#1a1a1a",
  taglineColor = "#64748b",
}) => {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        padding: "6px 12px",
        ml: -2.5,
        flexShrink: 0,
      }}
    >
      <Box
        component="img"
        src={Logo}
        alt="IncidentIQ Logo"
        sx={{
          height: height,
          width: "auto",
          objectFit: "contain",
        }}
      />

      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Typography
          sx={{
            fontFamily: "'DM Sans', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: 800,
            fontSize: nameFontSize,
            lineHeight: 1.2,
            ml: -0.4,
            letterSpacing: "-0.4px",
            color: nameColor,
          }}
        >
          Incident
          <span style={{ 
            color: "#6366f1", 
            fontWeight: 900,
            fontFamily: "'DM Sans', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif"
          }}>
            IQ
          </span>
        </Typography>

        <Typography
          sx={{
            fontFamily: "'DM Sans', 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
            fontWeight: 500,
            fontSize: taglineFontSize,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: taglineColor,
            ml: -0.4,
          }}
        >
          Incident Management
        </Typography>
      </Box>
    </Box>
  );
};

export default LogoBlock;