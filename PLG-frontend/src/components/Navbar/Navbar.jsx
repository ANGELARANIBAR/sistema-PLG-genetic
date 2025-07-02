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
  Container,
  Menu,
  MenuItem,
  Divider,
  Typography
} from "@mui/material";
import { Link, useLocation, useNavigate } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { useAuth } from "../../hooks/useAuth.jsx";
import logo from "../../assets/logo-plg.png";
import "./Navbar.css";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();  const navItems = [
    { path: "/pedidos", label: "Pedidos" },
    { path: "/flota", label: "Flota" },
    { path: "/configuracion", label: "Configuración" },
    { path: "/simulacion", label: "Simulación" }
  ];

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleUserMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
    navigate('/login');
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
            startIcon={<AccountCircleIcon />}
            onClick={handleUserMenuOpen}
          >
            {user?.usuario || 'Admin'}
          </Button>

          {/* Menú de usuario */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleUserMenuClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
          >
            <MenuItem disabled>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Typography variant="body2" fontWeight="600">
                  {user?.usuario || 'Usuario'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Sistema PLG
                </Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} />
              Cerrar Sesión
            </MenuItem>
          </Menu>
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
