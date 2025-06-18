// src/theme.js
import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif", // puedes poner solo 'Roboto' si no usas Inter
  },
  palette: {
    primary: {
      main: "#1f2937", // azul oscuro (navbar)
    },
    secondary: {
      main: "#f97316", // naranja (botón siguiente)
    },
  },
});

export default theme;
