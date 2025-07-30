package com.plg.planificacionplg.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import jakarta.persistence.EntityManagerFactory;

@Configuration
@EnableTransactionManagement
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*", "https://localhost:*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Bean
    public PlatformTransactionManager transactionManager(EntityManagerFactory entityManagerFactory) {
        JpaTransactionManager transactionManager = new JpaTransactionManager();
        transactionManager.setEntityManagerFactory(entityManagerFactory);
        
        // Configure for long-running genetic algorithm operations
        transactionManager.setDefaultTimeout(7200); // 2 hours
        transactionManager.setGlobalRollbackOnParticipationFailure(false);
        transactionManager.setFailEarlyOnGlobalRollbackOnly(false);
        transactionManager.setRollbackOnCommitFailure(true);
        
        System.out.println("🔧 Transaction Manager configured for genetic algorithm:");
        System.out.println("   Default timeout: 7200 seconds (2 hours)");
        System.out.println("   Global rollback on participation failure: false");
        System.out.println("   Fail early on global rollback: false");
        
        return transactionManager;
    }

    @Bean
    public TransactionTemplate transactionTemplate(PlatformTransactionManager transactionManager) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setTimeout(7200); // 2 hours for genetic algorithm
        template.setIsolationLevel(TransactionTemplate.ISOLATION_READ_UNCOMMITTED);
        template.setPropagationBehavior(TransactionTemplate.PROPAGATION_REQUIRES_NEW);
        
        System.out.println("🔧 Transaction Template configured:");
        System.out.println("   Timeout: 7200 seconds");
        System.out.println("   Isolation: READ_UNCOMMITTED");
        System.out.println("   Propagation: REQUIRES_NEW");
        
        return template;
    }
}