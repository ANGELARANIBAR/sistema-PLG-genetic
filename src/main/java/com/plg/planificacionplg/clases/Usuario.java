package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;

@Data
@NoArgsConstructor
@Entity
@Table(name = "usuario", indexes = {
    @Index(name = "idx_usuario_username", columnList = "username")
})
public class Usuario {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    int id;
    
    @Column(name = "username", unique = true, nullable = false, length = 50)
    String username;
    
    @Column(name = "contraseña", nullable = false, length = 255)
    String contraseña;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false)
    RolUsuario rol;
    
    void autenticarUsuario() {}
}

