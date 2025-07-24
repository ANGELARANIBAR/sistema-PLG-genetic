import React, { useMemo } from 'react';
import {
    Box,
    Typography,
    Card,
    CardContent,
    Chip,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Divider,
    Alert
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import TimerIcon from '@mui/icons-material/Timer';

/**
 * Componente que muestra una lista de los bloqueos activos
 */
export default function BloqueosListPanel({ system, currentTime, onItemSelect, selectedItem }) {
    // Filtrar solo bloqueos activos
    const activeBloqueos = useMemo(() => {
        if (!system?.bloqueos || !currentTime) {
            return [];
        }

        const active = [];

        system.bloqueos.forEach((bloqueo, index) => {
            const isActive = currentTime >= new Date(bloqueo.fechaHoraInicio) &&
                            currentTime <= new Date(bloqueo.fechaHoraFin);
            
            if (isActive) {
                const bloqueoWithId = { ...bloqueo, id: index };
                active.push(bloqueoWithId);
            }
        });

        return active;
    }, [system?.bloqueos, currentTime]);

    const handleBloqueoClick = (bloqueo) => {
        onItemSelect({
            type: 'bloqueo',
            id: bloqueo.id,
            data: bloqueo
        });
    };

    const formatDuration = (inicio, fin) => {
        const durationMs = new Date(fin) - new Date(inicio);
        const minutes = Math.round(durationMs / (1000 * 60));
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${minutes}m`;
    };

    const isSelected = (bloqueo) => {
        return selectedItem?.type === 'bloqueo' && selectedItem.id === bloqueo.id;
    };

    return (
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                    Bloqueos Activos
                </Typography>
            </Box>

            {/* Bloqueos Activos */}
            {activeBloqueos.length > 0 ? (
                <Card elevation={2} sx={{ mb: 2 }}>
                    <CardContent sx={{ pb: 1 }}>
                        <List dense>
                            {activeBloqueos.map((bloqueo, index) => (
                                <React.Fragment key={bloqueo.id}>
                                    <ListItem disablePadding>
                                        <ListItemButton
                                            onClick={() => handleBloqueoClick(bloqueo)}
                                            selected={isSelected(bloqueo)}
                                            sx={{
                                                borderRadius: 1,
                                                mb: 0.5,
                                                '&.Mui-selected': {
                                                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(244, 67, 54, 0.15)',
                                                    }
                                                }
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            Bloqueo #{bloqueo.id}
                                                        </Typography>
                                                        <Chip 
                                                            label="ACTIVO" 
                                                            color="error" 
                                                            size="small"
                                                            sx={{ fontSize: '10px', height: 20 }}
                                                        />
                                                    </Box>
                                                }
                                                secondary={
                                                    <Box sx={{ mt: 0.5 }}>
                                                        <Typography variant="caption" display="block">
                                                            <TimerIcon sx={{ fontSize: 12, mr: 0.5, verticalAlign: 'middle' }} />
                                                            Inicio: {new Date(bloqueo.fechaHoraInicio).toLocaleString('es-ES', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </Typography>
                                                        <Typography variant="caption" display="block">
                                                            Fin: {new Date(bloqueo.fechaHoraFin).toLocaleString('es-ES', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </Typography>
                                                        <Typography variant="caption" display="block" color="text.secondary">
                                                            Duración: {formatDuration(bloqueo.fechaHoraInicio, bloqueo.fechaHoraFin)}
                                                        </Typography>
                                                        <Typography variant="caption" display="block" color="text.secondary">
                                                            Rutas afectadas: {bloqueo.rutasBloqueadas?.length || 0} segmentos
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                    {index < activeBloqueos.length - 1 && <Divider />}
                                </React.Fragment>
                            ))}
                        </List>
                    </CardContent>
                </Card>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    No hay bloqueos activos en este momento.
                </Typography>
            )}
        </Box>
    );
}
