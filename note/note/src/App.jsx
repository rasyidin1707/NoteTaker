import React, { useEffect, useState, useMemo } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { purple, green } from "@mui/material/colors";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import CssBaseline from "@mui/material/CssBaseline";

import SignUp from "./components/SignUp";
import Login from "./components/Login";
import Home from "./components/Home";
import Welcome from "./components/Welcome";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize darkMode from localStorage or default to false (light mode)
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("darkMode");
    return stored === "true";
  });

  // Sync localStorage when darkMode changes
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Simple logout handler without navigation here
  const handleLogout = () => {
    return signOut(auth); // returns a Promise
  };

  // Theme definition with overrides for dark mode inputs etc.
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: darkMode ? "dark" : "light",
          primary: { main: purple[500] },
          secondary: { main: green[500] },
          text: {
            primary: darkMode ? "#ffffff" : "#000000",
            secondary: darkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(0,0,0,0.7)",
          },
          background: {
            default: darkMode ? "#121212" : "#fff",
            paper: darkMode ? "#1d1d1d" : "#fff",
          },
        },
        components: {
          MuiInputBase: {
            styleOverrides: {
              root: {
                color: darkMode ? "#fff" : undefined,
                backgroundColor: darkMode ? "#121212" : undefined,
              },
              input: {
                color: darkMode ? "#fff" : undefined,
              },
            },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              notchedOutline: {
                borderColor: darkMode ? "rgba(255,255,255,0.23)" : undefined,
              },
              root: {
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: darkMode ? "#f0f0f0" : undefined,
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: darkMode ? purple[300] : undefined,
                },
              },
              input: {
                color: darkMode ? "#fff" : undefined,
              },
            },
          },
          MuiInputLabel: {
            styleOverrides: {
              root: {
                color: darkMode ? "rgba(255, 255, 255, 0.7)" : undefined,
                "&.Mui-focused": {
                  color: darkMode ? purple[300] : undefined,
                },
              },
            },
          },
          MuiFormHelperText: {
            styleOverrides: {
              root: {
                color: darkMode ? "rgba(255, 255, 255, 0.7)" : undefined,
              },
            },
          },
        },
      }),
    [darkMode]
  );

  if (loading) return <p>Loading...</p>;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
          <Route
            path="/"
            element={
              user ? (
                <Home
                  user={user}
                  handleLogout={handleLogout} // Pass logout func only
                  darkMode={darkMode}
                  setDarkMode={setDarkMode}
                />
              ) : (
                <Navigate to="/welcome" replace />
              )
            }
          />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          {/* Optional catch-all fallback route */}
          <Route path="*" element={<Navigate to={user ? "/" : "/welcome"} replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
