import React from 'react';
import { useBatchRefreshMonitor } from '../hooks/useBatchRefreshMonitor';

const BatchRefreshMonitor = () => {
    // Monitor for batch refresh notifications
    useBatchRefreshMonitor(true, 2000);

    // This component doesn't render anything
    return null;
};

export default BatchRefreshMonitor; 