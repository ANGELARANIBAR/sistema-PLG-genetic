import React, { useState } from "react";
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Button, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText,
  useMediaQuery,
  useTheme,
  Container
} from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import logo from "../../assets/logo-plg.png";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { path: "/pedidos", label: "Pedidos" },
    { path: "/configuracion", label: "Configuración" },
    { path: "/simulacion", label: "Simulación" }
  ];

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const drawer = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        {navItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton 
              component={Link} 
              to={item.path}
              selected={location.pathname === item.path}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
  
  return (
    <AppBar position="static" sx={{ backgroundColor: "#1f2937" }}>
      <Container maxWidth="xl" disableGutters>
        <Toolbar className="toolbar">
          <Link to="/" className="logo-link">
            <img src={logo} alt="PLG logo" className="logo" />
          </Link>
          
          {isMobile ? (
            <>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleDrawer(true)}
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
              <Box sx={{ flexGrow: 1 }} />
            </>
          ) : (
            <Box className="nav-buttons-container">
              {navItems.map((item) => (
                <Button 
                  key={item.path}
                  color="inherit" 
                  component={Link} 
                  to={item.path}
                  className={`nav-button ${location.pathname === item.path ? "active-nav-button" : ""}`}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
          
          <Button 
            color="inherit" 
            className="admin-button"
            startIcon={<div className="admin-icon">👤</div>}
          >
            Admin
          </Button>
        </Toolbar>
      </Container>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
}
