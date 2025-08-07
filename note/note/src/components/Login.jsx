import React, { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, TextField, Button } from "@mui/material";
import PasswordField from "./PasswordField";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // For demonstration: simple password error state
  const [passwordError, setPasswordError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Card sx={{ minWidth: 350 }}>
        <CardContent>
          <Typography variant="h5" mb={2}>
            Login
          </Typography>
          <form onSubmit={handleLogin} noValidate>
            <TextField
              label="Email"
              variant="outlined"
              margin="normal"
              fullWidth
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
            <PasswordField
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(passwordError)}
              helperText={passwordError}
              required
            />
            <Button variant="contained" color="primary" fullWidth type="submit" sx={{ mt: 2 }}>
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
