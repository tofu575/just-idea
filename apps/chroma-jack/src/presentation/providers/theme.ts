import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#171717', contrastText: '#ffffff' },
    background: { default: '#f4f2ed', paper: '#ffffff' },
    text: { primary: '#171717', secondary: '#66625b' },
  },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.05em' },
    h2: { fontWeight: 750, letterSpacing: '-0.035em' },
    button: { fontWeight: 700, letterSpacing: '0.02em' },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 48, paddingInline: 22, textTransform: 'none' },
      },
    },
  },
});
