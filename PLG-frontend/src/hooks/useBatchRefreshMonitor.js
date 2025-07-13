import { useEffect, useRef } from 'react';
import { simulationService } from '../services/simulationService';

export const useBatchRefreshMonitor = (enabled = true, intervalMs = 2000, onRefreshCallback = null) => {
    const intervalRef = useRef(null);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const checkBatchRefresh = async () => {
            try {
                // Check if there's a real simulation running by calling the system endpoint
                // The system endpoint now only returns data from mejorSolucion (real simulation)
                const response = await fetch('/api/solution/system');
                if (!response.ok) {
                    return;
                }
                
                const systemData = await response.json();
                
                // Only poll for batch refresh if there's actual fleet data from a real simulation
                // If systemData is empty or has no fleet, it means no real simulation is running
                if (!systemData || !systemData.flota || systemData.flota.length === 0) {
                    return;
                }
                
                const batchResponse = await simulationService.getBatchRefreshStatus();
                
                //console.log('Batch refresh check:', batchResponse);
                
                if (batchResponse.needsRefresh) {
                    //console.log('Batch refresh needed. Refreshing page...');
                    // Add a small delay to ensure the backend has processed everything
                    setTimeout(() => {
                        // Store a flag in sessionStorage to indicate we should auto-play after refresh
                        sessionStorage.setItem('autoPlayAfterRefresh', 'true');
                        window.location.reload();
                    }, 1000);
                }
            } catch (error) {
                console.error('Error checking batch refresh status:', error);
            }
        };

        // Start the interval
        intervalRef.current = setInterval(checkBatchRefresh, intervalMs);

        // Cleanup on unmount
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, intervalMs, onRefreshCallback]);
}; 