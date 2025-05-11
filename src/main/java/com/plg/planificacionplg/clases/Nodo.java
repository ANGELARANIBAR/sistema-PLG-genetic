package com.plg.planificacionplg.clases;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Data
public class Nodo {
    private int id;
    private double posX, posY;
    private LocalDateTime llegada;
    public Nodo(double posX, double posY){
        this.posX = posX;
        this.posY = posY;
    }
    public double distanciaManhattan(Nodo otro) {
        return Math.abs(this.posX - otro.posX) + Math.abs(this.posY - otro.posY);
    }
    public boolean sonIguales(Nodo otro) {
        return Math.abs(this.posX-otro.posX)<0.0001 && Math.abs(this.posY-otro.posY)<0.001;
    }

    public boolean estaEntre(Nodo start, Nodo end) {
        // Verifica si la recta es vertical (mismo posX)
        if (Math.abs(start.getPosX() - end.getPosX()) < 0.001) {
            return Math.abs(start.getPosX() - this.posX) < 0.001 &&
                    ((start.getPosY() <= this.posY && this.posY <= end.getPosY()) ||
                            (end.getPosY() <= this.posY && this.posY <= start.getPosY()));
        }

        // Verifica si la recta es horizontal (mismo posY)
        if (Math.abs(start.getPosY() - end.getPosY()) < 0.001) {
            return Math.abs(start.getPosY() - this.posY) < 0.001 &&
                    ((start.getPosX() <= this.posX && this.posX <= end.getPosX()) ||
                            (end.getPosX() <= this.posX && this.posX <= start.getPosX()));
        }
        return false;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj == null || getClass() != obj.getClass()) return false;
        if (this.sonIguales((Nodo)obj)) return true;
        else return false;
    }

    @Override
    public int hashCode() {
        return Objects.hash(posX, posY); // usa los mismos atributos que en equals
    }

        public static void main(String[] args) {
            // Crear nodos de prueba
            Nodo nodo1 = new Nodo(0.0, 0.0);
            Nodo nodo2 = new Nodo(0.0, 5.0);
            Nodo intermedio1 = new Nodo(0.0, 2.5);
            Nodo intermedio2 = new Nodo(0.0, 6.0); // Fuera del rango
            Nodo nodoHorizontal1 = new Nodo(3.0, 2.0);
            Nodo nodoHorizontal2 = new Nodo(7.0, 2.0);
            Nodo intermedioHorizontal = new Nodo(5.0, 2.0);

            // Pruebas para nodos verticales
            System.out.println("Intermedio1 está entre nodo1 y nodo2 (vertical): " + intermedio1.estaEntre(nodo1, nodo2));
            System.out.println("Intermedio2 está entre nodo1 y nodo2 (vertical): " + intermedio2.estaEntre(nodo1, nodo2));

            // Pruebas para nodos horizontales
            System.out.println("IntermedioHorizontal está entre nodoHorizontal1 y nodoHorizontal2 (horizontal): " + intermedioHorizontal.estaEntre(nodoHorizontal1, nodoHorizontal2));
        }


}