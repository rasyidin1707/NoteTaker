import { createTheme } from '@mui/material/styles';
import { purple, green } from '@mui/material/colors';

const theme = createTheme({
  palette: {
    primary: {
      main: purple[500],       // Your main brand color
    },
    secondary: {
      main: green[500],        // Accent color
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      marginBottom: '1rem',
    },
    button: {
      textTransform: 'none',
    },
  }
});

export default theme;