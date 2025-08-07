import React, { useState } from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useTheme } from "@mui/material/styles";

const PasswordField = ({ label, value, onChange, error, helperText, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const theme = useTheme();

  const handleToggleShowPassword = () => setShowPassword((show) => !show);

  const iconColor = theme.palette.mode === "dark" ? "#fff" : "rgba(0,0,0,0.54)";

  return (
    <TextField
      label={label}
      type={showPassword ? "text" : "password"}
      value={value}
      onChange={onChange}
      variant="outlined"
      fullWidth
      error={error}
      helperText={helperText}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={handleToggleShowPassword}
              edge="end"
              aria-label={showPassword ? "Hide password" : "Show password"}
              sx={{ color: iconColor }}
              tabIndex={-1}
            >
              {showPassword ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );
};

export default PasswordField;
