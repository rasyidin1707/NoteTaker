// src/components/Welcome.jsx
import React from "react";
import { Container, Typography, Button, Box, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to NoteTaker Apps
        </Typography>
        <Typography variant="subtitle1" sx={{ mb: 4 }}>
          Your simple and secure note tracking app.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </Button>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={() => navigate("/login")}
          >
            Log In
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default Welcome;
