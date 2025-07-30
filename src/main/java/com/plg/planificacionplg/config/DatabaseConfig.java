package com.plg.planificacionplg.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.persistence.EntityManagerFactory;
import javax.sql.DataSource;

@Configuration
@EnableTransactionManagement
public class DatabaseConfig {

    @Value("${spring.datasource.url}")
    private String jdbcUrl;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        
        // Basic connection settings
        config.setJdbcUrl(jdbcUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");
        
        // Pool settings optimized for long-running simulations
        config.setMaximumPoolSize(25);
        config.setMinimumIdle(10);
        config.setConnectionTimeout(30000);
        config.setIdleTimeout(300000); // 5 minutes
        config.setMaxLifetime(1200000); // 20 minutes (less than MySQL default wait_timeout)
        config.setLeakDetectionThreshold(60000); // 1 minute
        
        // Validation settings to handle connection drops
        config.setConnectionTestQuery("SELECT 1");
        config.setConnectionInitSql("SELECT 1");
        config.setValidationTimeout(5000);
        
        // Pool name for identification
        config.setPoolName("PLG-SimulationPool");
        
        // Additional MySQL-specific properties
        config.addDataSourceProperty("cachePrepStmts", "true");
        config.addDataSourceProperty("prepStmtCacheSize", "250");
        config.addDataSourceProperty("prepStmtCacheSqlLimit", "2048");
        config.addDataSourceProperty("useServerPrepStmts", "true");
        config.addDataSourceProperty("useLocalSessionState", "true");
        config.addDataSourceProperty("rewriteBatchedStatements", "true");
        config.addDataSourceProperty("cacheResultSetMetadata", "true");
        config.addDataSourceProperty("cacheServerConfiguration", "true");
        config.addDataSourceProperty("elideSetAutoCommits", "true");
        config.addDataSourceProperty("maintainTimeStats", "false");
        
        // Handle connection recovery
        config.addDataSourceProperty("autoReconnect", "true");
        config.addDataSourceProperty("failOverReadOnly", "false");
        config.addDataSourceProperty("maxReconnects", "10");
        config.addDataSourceProperty("initialTimeout", "10");
        
        return new HikariDataSource(config);
    }

    @Bean
    @Primary
    public PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactory);
        
        // Set transaction timeout for long operations (5 minutes)
        transactionManager.setDefaultTimeout(300);
        
        return transactionManager;
    }
} 