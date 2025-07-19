import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    TextField,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Chip,
    InputAdornment,
    Tabs,
    Tab,
    Divider,
    Paper
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorageIcon from '@mui/icons-material/Storage';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const ItemListPanel = ({ 
    system, 
    onItemSelect, 
    selectedItem,
    truckFuels,
    truckGLPs,
    cisternaGLPs 
}) => {
    const [activeTab, setActiveTab] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
        setSearchQuery(''); // Clear search when switching tabs
    };

    // Filter function for search
    const filterItems = (items, query, type) => {
        if (!query.trim()) return items;
        
        const lowerQuery = query.toLowerCase();
        
        return items.filter(item => {
            switch (type) {
                case 'trucks':
                    return (
                        item.codigo?.toLowerCase().includes(lowerQuery) ||
                        item.plate?.toLowerCase().includes(lowerQuery) ||
                        item.truckId?.toString().includes(lowerQuery)
                    );
                case 'cisternas':
                    return (
                        item.id?.toString().includes(lowerQuery) ||
                        (item.principal ? 'principal' : 'secundaria').includes(lowerQuery)
                    );
                case 'pedidos':
                    return (
                        item.numeroPedido?.toLowerCase().includes(lowerQuery) ||
                        item.id?.toString().includes(lowerQuery) ||
                        item.estado?.toLowerCase().includes(lowerQuery)
                    );
                default:
                    return true;
            }
        });
    };

    // Memoized filtered data
    const filteredTrucks = useMemo(() => {
        return filterItems(system?.flota || [], searchQuery, 'trucks');
    }, [system?.flota, searchQuery]);

    const filteredCisternas = useMemo(() => {
        return filterItems(system?.cisternas || [], searchQuery, 'cisternas');
    }, [system?.cisternas, searchQuery]);

    const filteredPedidos = useMemo(() => {
        return filterItems(system?.pedidos || [], searchQuery, 'pedidos');
    }, [system?.pedidos, searchQuery]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'PENDIENTE':
                return 'warning';
            case 'EN_PROGRESO':
                return 'info';
            case 'COMPLETADO':
                return 'success';
            case 'CANCELADO':
                return 'error';
            default:
                return 'default';
        }
    };

    const isItemSelected = (type, id) => {
        return selectedItem?.type === type && selectedItem?.id === id;
    };

    const renderTruckItem = (truck) => {
        const currentFuel = truckFuels.get(truck.truckId) || 0;
        const currentGLP = truckGLPs.get(truck.truckId) || 0;
        
        return (
            <ListItem key={truck.truckId} disablePadding>
                <ListItemButton 
                    selected={isItemSelected('truck', truck.truckId)}
                    onClick={() => onItemSelect({ type: 'truck', id: truck.truckId })}
                    sx={{
                        '&.Mui-selected': {
                            backgroundColor: 'primary.light',
                            color: 'primary.contrastText',
                            '&:hover': {
                                backgroundColor: 'primary.main',
                            }
                        }
                    }}
                >
                    <ListItemIcon>
                        <LocalShippingIcon color={isItemSelected('truck', truck.truckId) ? 'inherit' : 'primary'} />
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight="bold" component="span">
                                    {truck.codigo}
                                </Typography>
                                <span style={{ display: 'flex', gap: 4 }}>
                                    <Chip 
                                        label={`${currentFuel.toFixed(0)}%`} 
                                        size="small" 
                                        color="info"
                                        sx={{ fontSize: '10px', height: '18px' }}
                                    />
                                    <Chip 
                                        label={`${currentGLP.toFixed(0)}L`} 
                                        size="small" 
                                        color="success"
                                        sx={{ fontSize: '10px', height: '18px' }}
                                    />
                                </span>
                            </span>
                        }
                        secondary={
                            <Typography variant="caption" color="text.secondary">
                                Placa: {truck.plate}
                            </Typography>
                        }
                    />
                </ListItemButton>
            </ListItem>
        );
    };

    const renderCisternaItem = (cisterna, index) => {
        const currentGLP = cisternaGLPs.get(cisterna?.id) ?? cisterna?.cargaGLPActual;
        
        return (
            <ListItem key={cisterna.id || index} disablePadding>
                <ListItemButton 
                    selected={isItemSelected('cisterna', index)}
                    onClick={() => onItemSelect({ type: 'cisterna', id: index })}
                    sx={{
                        '&.Mui-selected': {
                            backgroundColor: 'success.light',
                            color: 'success.contrastText',
                            '&:hover': {
                                backgroundColor: 'success.main',
                            }
                        }
                    }}
                >
                    <ListItemIcon>
                        <StorageIcon color={isItemSelected('cisterna', index) ? 'inherit' : 'success'} />
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight="bold" component="span">
                                    Cisterna {cisterna.id}
                                </Typography>
                                <span style={{ display: 'flex', gap: 4 }}>
                                    {cisterna.principal && (
                                        <Chip 
                                            label="Principal" 
                                            size="small" 
                                            color="primary"
                                            sx={{ fontSize: '10px', height: '18px' }}
                                        />
                                    )}
                                    <Chip 
                                        label={`${currentGLP?.toFixed(0) || 0}L`} 
                                        size="small" 
                                        color="success"
                                        sx={{ fontSize: '10px', height: '18px' }}
                                    />
                                </span>
                            </span>
                        }
                        secondary={
                            <Typography variant="caption" color="text.secondary">
                                Capacidad: {cisterna.capacidadTotal}L • ({cisterna.ubicacion.x}, {cisterna.ubicacion.y})
                            </Typography>
                        }
                    />
                </ListItemButton>
            </ListItem>
        );
    };

    const renderPedidoItem = (pedido) => {
        return (
            <ListItem key={pedido.id} disablePadding>
                <ListItemButton 
                    selected={isItemSelected('pedido', pedido.id)}
                    onClick={() => onItemSelect({ type: 'pedido', id: pedido.id })}
                    sx={{
                        '&.Mui-selected': {
                            backgroundColor: 'secondary.light',
                            color: 'secondary.contrastText',
                            '&:hover': {
                                backgroundColor: 'secondary.main',
                            }
                        }
                    }}
                >
                    <ListItemIcon>
                        <ShoppingCartIcon color={isItemSelected('pedido', pedido.id) ? 'inherit' : 'secondary'} />
                    </ListItemIcon>
                    <ListItemText
                        primary={
                            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" fontWeight="bold" component="span">
                                    {pedido.numeroPedido}
                                </Typography>
                                <span style={{ display: 'flex', gap: 4 }}>
                                    <Chip 
                                        label={pedido.estado} 
                                        size="small" 
                                        color={getStatusColor(pedido.estado)}
                                        sx={{ fontSize: '10px', height: '18px' }}
                                    />
                                    <Chip 
                                        label={`${pedido.volumenGLP}m³`} 
                                        size="small" 
                                        color="info"
                                        sx={{ fontSize: '10px', height: '18px' }}
                                    />
                                </span>
                            </span>
                        }
                        secondary={
                            <Typography variant="caption" color="text.secondary">
                                Ubicación: ({pedido.ubicacion.x}, {pedido.ubicacion.y})
                            </Typography>
                        }
                    />
                </ListItemButton>
            </ListItem>
        );
    };

    const getCurrentData = () => {
        switch (activeTab) {
            case 0:
                return { data: filteredTrucks, render: renderTruckItem };
            case 1:
                return { data: filteredCisternas, render: renderCisternaItem };
            case 2:
                return { data: filteredPedidos, render: renderPedidoItem };
            default:
                return { data: [], render: () => null };
        }
    };

    const { data, render } = getCurrentData();

    return (
        <Paper elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, pb: 1 }}>
                <Typography variant="h6" gutterBottom>
                    Elementos del Sistema
                </Typography>
                
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    variant="fullWidth"
                    sx={{ mb: 2 }}
                >
                    <Tab 
                        label={`Camiones (${filteredTrucks.length})`}
                        icon={<LocalShippingIcon fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab 
                        label={`Cisternas (${filteredCisternas.length})`}
                        icon={<StorageIcon fontSize="small" />}
                        iconPosition="start"
                    />
                    <Tab 
                        label={`Pedidos (${filteredPedidos.length})`}
                        icon={<ShoppingCartIcon fontSize="small" />}
                        iconPosition="start"
                    />
                </Tabs>

                <TextField
                    fullWidth
                    size="small"
                    placeholder={`Buscar ${activeTab === 0 ? 'camiones' : activeTab === 1 ? 'cisternas' : 'pedidos'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            <Divider />

            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                <List dense>
                    {data.length > 0 ? (
                        data.map((item, index) => render(item, index))
                    ) : (
                        <ListItem>
                            <ListItemText
                                primary={
                                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                                        {searchQuery ? 'No se encontraron resultados' : 'No hay elementos disponibles'}
                                    </Typography>
                                }
                            />
                        </ListItem>
                    )}
                </List>
            </Box>
        </Paper>
    );
};

export default ItemListPanel;
