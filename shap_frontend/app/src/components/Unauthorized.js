import { Box, Typography } from "@mui/material";

const Unauthorized = () => {
  return (
    <Box sx={{ textAlign: "center", mt: 10 }}>
      <Typography variant="h4">403</Typography>
      <Typography>You don't have permission to access this page.</Typography>
    </Box>
  );
};

export default Unauthorized;