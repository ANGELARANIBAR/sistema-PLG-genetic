package com.plg.planificacionplg.clases;

import lombok.Data;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class SistemaPLG {
    private List<Cisterna> cisternas;
    private List<Camion> flota;
    private List<Camion> camionesAveriados;
    private List<Bloqueo> bloqueos;
    private double maxXmapa;
    private double maxYmapa;
    private List<Pedido> pedidos;
    private List<Pedido> pedidosTodos;
    private double distanciaManzana;
    private LocalDateTime fechaHoraInicio;
    private List<LocalTime> turnosFin; //ordenado ascendentemente
    private List<Averia> averias;

    public SistemaPLG() {}
    public SistemaPLG(SistemaPLG otro) {
        this.cisternas = new ArrayList<>();
        for(Cisterna cisterna : otro.cisternas) {
            this.cisternas.add(new Cisterna(cisterna));
        }
        this.flota = new ArrayList<>();
        for (Camion camion : otro.flota) {
            this.flota.add(new Camion(camion));
        }

        this.camionesAveriados = otro.camionesAveriados;
        this.bloqueos = otro.bloqueos;
        this.maxXmapa = otro.maxXmapa;
        this.maxYmapa = otro.maxYmapa;
        this.pedidos = new ArrayList<>();
        for (Pedido pedido : otro.pedidos) {
            this.pedidos.add(new Pedido(pedido));
        }
        this.distanciaManzana = otro.distanciaManzana;
        this.fechaHoraInicio = otro.fechaHoraInicio;
        this.turnosFin = otro.turnosFin;
        this.averias = otro.averias;
    }
    public List<Nodo> encontrarTramo(Nodo start, Nodo end) {
        List<Nodo> lista = new ArrayList<Nodo>();
        lista.add(start);
        double sentido;
        // Verifica si los nodos están en línea recta (horizontal o vertical)
        if (Math.abs(start.getPosY() - end.getPosY()) < 0.001) { // Horizontal
            if(start.getPosX() < end.getPosX())
                sentido = 1;
            else sentido = -1;
            for (double x = start.getPosX() + sentido*distanciaManzana; x*sentido < end.getPosX()*sentido; x += sentido*distanciaManzana) {
                lista.add(new Nodo(x, start.getPosY()));
            }
        } else if (Math.abs(start.getPosX() - end.getPosX()) < 0.001) { // Vertical
            if(start.getPosY() < end.getPosY())
                sentido = 1;
            else sentido = -1;
            for (double y = start.getPosY() + sentido*distanciaManzana; y*sentido < end.getPosY()*sentido; y += sentido*distanciaManzana) {
                lista.add(new Nodo(start.getPosX(), y));
            }
        }
        lista.add(end);
        return lista;
    }
    public static void main(String[] args) {
        SistemaPLG sistema = new SistemaPLG();
        sistema.distanciaManzana = 3.0; // Define la distancia entre nodos

        // Crea nodos de prueba
        Nodo start = new Nodo(2.0, 3.0); // Nodo inicial
        Nodo end = new Nodo(2.0, 31);   // Nodo final

        // Llama al método encontrarTramo
        List<Nodo> tramo = sistema.encontrarTramo(start, end);

        // Imprime los nodos del tramo
        System.out.println("Tramo entre nodos:");
        for (Nodo nodo : tramo) {
            System.out.println("Nodo en posición: (" + nodo.getPosX() + ", " + nodo.getPosY() + ")");
        }
    }

}
