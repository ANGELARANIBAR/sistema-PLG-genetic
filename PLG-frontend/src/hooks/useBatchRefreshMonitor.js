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
                const response = await simulationService.getBatchRefreshStatus();
                
                //console.log('Batch refresh check:', response);
                
                if (response.needsRefresh) {
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