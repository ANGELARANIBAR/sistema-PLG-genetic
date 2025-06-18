import React, { useState } from 'react';
import { simulationService } from '../services/simulationService';

const SimulationControl = () => {
    const [fechaHoraInicio, setFechaHoraInicio] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInitializeFechaHora = async () => {
        if (!fechaHoraInicio) {
            setMessage('Por favor, seleccione una fecha y hora de inicio');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            const result = await simulationService.initializeFechaHora(fechaHoraInicio);
            setMessage(`✅ ${result}`);
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecuteSimulationWithFecha = async () => {
        if (!fechaHoraInicio) {
            setMessage('Por favor, seleccione una fecha y hora de inicio');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            await simulationService.executeSimulationWithFecha(fechaHoraInicio);
            setMessage('✅ Simulación iniciada con fecha y hora personalizada');
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecuteSimulationDefault = async () => {
        setIsLoading(true);
        setMessage('');

        try {
            await simulationService.executeSimulation();
            setMessage('✅ Simulación iniciada con fecha y hora actual');
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>Control de Simulación PLG</h2>
            
            <div style={{ marginBottom: '20px' }}>
                <label htmlFor="fechaHoraInicio" style={{ display: 'block', marginBottom: '5px' }}>
                    Fecha y Hora de Inicio:
                </label>
                <input
                    type="datetime-local"
                    id="fechaHoraInicio"
                    value={fechaHoraInicio}
                    onChange={(e) => setFechaHoraInicio(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ccc',
                        borderRadius: '4px'
                    }}
                />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button
                    onClick={handleInitializeFechaHora}
                    disabled={isLoading || !fechaHoraInicio}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading || !fechaHoraInicio ? 'not-allowed' : 'pointer',
                        opacity: isLoading || !fechaHoraInicio ? 0.6 : 1
                    }}
                >
                    {isLoading ? 'Inicializando...' : 'Inicializar Fecha/Hora'}
                </button>

                <button
                    onClick={handleExecuteSimulationWithFecha}
                    disabled={isLoading || !fechaHoraInicio}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading || !fechaHoraInicio ? 'not-allowed' : 'pointer',
                        opacity: isLoading || !fechaHoraInicio ? 0.6 : 1
                    }}
                >
                    {isLoading ? 'Ejecutando...' : 'Ejecutar Simulación con Fecha'}
                </button>

                <button
                    onClick={handleExecuteSimulationDefault}
                    disabled={isLoading}
                    style={{
                        padding: '10px 15px',
                        backgroundColor: '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.6 : 1
                    }}
                >
                    {isLoading ? 'Ejecutando...' : 'Ejecutar Simulación (Fecha Actual)'}
                </button>
            </div>

            {message && (
                <div style={{
                    padding: '10px',
                    borderRadius: '4px',
                    backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
                    color: message.includes('✅') ? '#155724' : '#721c24',
                    border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                    {message}
                </div>
            )}

            <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
                <h3>Instrucciones:</h3>
                <ul>
                    <li><strong>Inicializar Fecha/Hora:</strong> Solo establece la fecha y hora de inicio sin ejecutar la simulación</li>
                    <li><strong>Ejecutar Simulación con Fecha:</strong> Ejecuta la simulación usando la fecha y hora especificada</li>
                    <li><strong>Ejecutar Simulación (Fecha Actual):</strong> Ejecuta la simulación usando la fecha y hora actual del sistema</li>
                </ul>
            </div>
        </div>
    );
};

export default SimulationControl; 