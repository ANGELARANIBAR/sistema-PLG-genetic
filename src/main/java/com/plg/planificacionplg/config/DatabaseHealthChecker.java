package com.plg.planificacionplg.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Component
public class DatabaseHealthChecker {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseHealthChecker.class);
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    private ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);
    private boolean healthCheckRunning = false;

    /**
     * Starts periodic health checks during long-running operations
     * This helps prevent connection timeouts during simulation/replanification
     */
    public void startHealthCheck() {
        if (!healthCheckRunning) {
            logger.info("🔄 Starting database health checks for long-running simulation");
            healthCheckRunning = true;
            
            scheduler.scheduleAtFixedRate(() -> {
                try {
                    // Simple ping to keep connections alive
                    jdbcTemplate.queryForObject("SELECT 1", Integer.class);
                    logger.debug("✅ Database health check successful");
                } catch (Exception e) {
                    logger.warn("⚠️ Database health check failed: {}", e.getMessage());
                }
            }, 0, 2, TimeUnit.MINUTES); // Check every 2 minutes
        }
    }

    /**
     * Stops the health check when the long operation completes
     */
    public void stopHealthCheck() {
        if (healthCheckRunning) {
            logger.info("🛑 Stopping database health checks");
            healthCheckRunning = false;
            scheduler.shutdown();
            scheduler = Executors.newScheduledThreadPool(1); // Reset for next use
        }
    }

    /**
     * Manual health check that can be called during critical operations
     */
    public boolean performHealthCheck() {
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            logger.debug("✅ Manual database health check successful");
            return true;
        } catch (Exception e) {
            logger.error("❌ Manual database health check failed: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Check if health monitoring is currently active
     */
    public boolean isHealthCheckRunning() {
        return healthCheckRunning;
    }
} 