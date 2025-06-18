package com.plg.planificacionplg.clases;

import jakarta.persistence.Entity;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.swing.*;
import java.io.BufferedReader;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.IOException;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Data
@NoArgsConstructor
public class SistemaPLG {

    private long id;
    private List<Cisterna> cisternas;
    private List<Camion> flota;
    private List<Bloqueo> bloqueos;
    private double tiempoEntregaMin;
    private double maxXmapa;
    private double maxYmapa;
    private List<Pedido> pedidos;
    private List<Pedido> pedidosTodos;
    private double distanciaManzana;
    private LocalDateTime fechaHoraInicio;
    private List<LocalTime> turnosFin; //ordenado ascendentemente
    private List<Camion> camionesAveriados;
    private List<Averia> averias;
    private Camion camionCausanteReplan;    private boolean replanning = false;
    private LocalDateTime averiaStartTime = null;

    // Constructor copia
    public SistemaPLG(SistemaPLG otro) {
        this.cisternas = new ArrayList<>();
        for(Cisterna cisterna : otro.cisternas) {
            this.cisternas.add(new Cisterna(cisterna));
        }
        this.flota = new ArrayList<>();
        for (Camion camion : otro.flota) {
            this.flota.add(new Camion(camion));
        }

        if(otro.camionesAveriados!=null){
            this.camionesAveriados = new ArrayList<>();
            for(Camion camion : otro.camionesAveriados)
                this.camionesAveriados.add(new Camion(camion));
        }
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
        if(otro.camionCausanteReplan != null) {
            this.camionCausanteReplan = this.flota.get(otro.camionCausanteReplan.getId()-1);
        }
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

    public void estadoDePedidosALas(LocalDateTime fecha){
        Boolean estaEnDestino = false;
        for(Camion c : flota){
            if(c.getDestinos().isEmpty())continue;

            Destino anterior = c.getDestinos().get(0), d;
            if(anterior.getFechaHoraSalida()==null || (c.getDestinos().get(1)!=null && c.getDestinos().get(1).getFechaHoraLlegada()==null))continue;

            if(anterior.getFechaHoraSalida().isAfter(fecha))continue;

            int i=0;
            for(i = 1; i<c.getDestinos().size(); i++){
                d = c.getDestinos().get(i);
                if(d.getFechaHoraLlegada().isAfter(fecha)){
                    break;
                }
                else{
                    if(d.getFechaHoraSalida().isAfter(fecha)||d.getFechaHoraLlegada().isEqual(fecha)){
                        i++;
                        estaEnDestino = true;
                        break;
                    }
                }
                anterior = d;
            }
            if(i==c.getDestinos().size()){continue;}
            if(estaEnDestino){
                // hora de salida de replanificaicon es cuando acabes de entregar el pedido
                d = c.getDestinos().get(i);
                if(d instanceof EntregaPedido){
                    ((EntregaPedido)d).getPedido().setEstado(EstadoPedido.DESPACHANDO);
                }
            }
            c.setIdxDestinoEnCurso(i);
            for(int j = 0; j<i; j++){
                d = c.getDestinos().get(j);
                if(d instanceof EntregaPedido)
                    ((EntregaPedido)d).getPedido().setEstado(EstadoPedido.ENTREGADO);
            }
            for(int j = i; j<c.getDestinos().size(); j++){
                d = c.getDestinos().get(j);
                if(d instanceof EntregaPedido)
                    ((EntregaPedido)d).getPedido().setEstado(EstadoPedido.PENDIENTE);
            }
        }
    }
    public double calcularGLPActual(int idCamion, LocalDateTime fecha){
        Camion c = flota.get(idCamion-1);
        if(c.getDestinos().isEmpty())return 0.0;
        Destino anterior = c.getDestinos().get(0), d;
        if(anterior.getFechaHoraSalida()==null || (c.getDestinos().get(1)!=null && c.getDestinos().get(1).getFechaHoraLlegada()==null))return anterior.getSaldoGLPCamion();
        if(anterior instanceof Replanficacion &&
                fecha.isBefore(anterior.getFechaHoraSalida())) {
            if((((Replanficacion) anterior).getOperaciones()!=null)){
                List<OperacionesGLPCisterna> operaciones = ((Replanficacion) anterior).getOperaciones();
                operaciones.sort(Comparator.comparing(OperacionesGLPCisterna::getFechaHoraOperacion));
                for(OperacionesGLPCisterna op : operaciones){
                    if(fecha.isBefore(op.getFechaHoraOperacion())){
                        return op.getSaldoGLP() + op.getCantSalidaGLP();
                    }
                    if((fecha.isEqual(op.getFechaHoraOperacion()))){
                        return op.getSaldoGLP();
                    }
                }
            }
            return anterior.getSaldoGLPCamion();
        }
        if(anterior.getFechaHoraSalida().isAfter(fecha)){
            return anterior.getSaldoGLPCamion();
        }
        int i=0;
        for(i = 1; i<c.getDestinos().size(); i++){
            d = c.getDestinos().get(i);
            if(d.getFechaHoraLlegada().isAfter(fecha)){
                return anterior.getSaldoGLPCamion();
            }
            else{
                if(d.getFechaHoraSalida().isAfter(fecha)||d.getFechaHoraLlegada().isEqual(fecha)){
                    d.getSaldoGLPCamion();
                }
            }
            anterior = d;
        }
        return c.getDestinos().getLast().getSaldoGLPCamion();
    }

    public Camion getCamionEnInstante(int idCamion, LocalDateTime fecha){
        Camion c = flota.get(idCamion-1);
        Camion camion = new Camion(c);
        if(c.getDestinos().isEmpty())return camion;
        Destino anterior = c.getDestinos().get(0), d;
        if(anterior.getFechaHoraSalida()==null || (c.getDestinos().get(1)!=null && c.getDestinos().get(1).getFechaHoraLlegada()==null))
            return camion;
        if(anterior.getFechaHoraSalida().isAfter(fecha)){
            camion.setCombustibleActual(anterior.getSaldoCombustibleCamion());
            camion.setCargaGLPActual(anterior.getSaldoGLPCamion());
            camion.setUbicacionActual(anterior.getUbicacion());
            camion.setIdxDestinoEnCurso(0);
            camion.setDestinoEnCurso(anterior);
            if(anterior.getEstadoCamion()!=null)
                camion.setEstado(anterior.getEstadoCamion());
            //else camion.setEstado(EstadoCamion.DISPONIBLE);
            return camion;
        }
        int i=0;
        for(i = 1; i<c.getDestinos().size(); i++){
            d = c.getDestinos().get(i);
            if(d.getFechaHoraLlegada().isAfter(fecha)){
                double tiempoEnRuta = Duration.between(anterior.getFechaHoraSalida(), fecha).toMinutes();
                camion.setCombustibleActual(anterior.getSaldoCombustibleCamion()-(int)(Math.abs(tiempoEnRuta)*c.getTipo()
                        .getVelocidadPromedio())*distanciaManzana*c.calcularPesoTotal()/180.0);
                camion.setCargaGLPActual(anterior.getSaldoGLPCamion());
                camion.setUbicacionActual(d.getRuta().getNodos().get((int)(Math.abs(tiempoEnRuta)*c.getTipo().getVelocidadPromedio())));
                if(i==c.getDestinos().size()-1){
                    camion.setEstado(EstadoCamion.EN_RETORNO);
                }else camion.setEstado(EstadoCamion.EN_RUTA);
                camion.setIdxDestinoEnCurso(i);
                camion.setDestinoEnCurso(d);
                return camion;
            }
            else{
                if(d.getFechaHoraSalida().isAfter(fecha)||d.getFechaHoraLlegada().isEqual(fecha)){
                    camion.setCombustibleActual(d.getSaldoCombustibleCamion());
                    camion.setCargaGLPActual(d.getSaldoGLPCamion());
                    camion.setUbicacionActual(d.getUbicacion());
                    if(d instanceof EntregaPedido)
                        camion.setEstado(EstadoCamion.DESPACHANDO);
                    else if (d instanceof Reabastecimiento) {
                        if(i==c.getDestinos().size()-1){camion.setEstado(EstadoCamion.EN_MANTENIMIENTO);}
                        else{
                            if(d.getGLPOperacion()>0.001)camion.setEstado(EstadoCamion.EN_RECARGA_GLP);
                            else camion.setEstado(EstadoCamion.EN_RECARGA_COMBUSTIBLE);
                        }
                    }
                    else{// trasvase
                        camion.setEstado(EstadoCamion.EN_RECARGA_GLP);
                    }
                    camion.setIdxDestinoEnCurso(i);
                    camion.setDestinoEnCurso(d);
                    return camion;
                }
            }
            anterior = d;
        }
        camion.setEstado(EstadoCamion.DISPONIBLE);
        return camion;
    }


    public List<Camion> cargarMantenimientos(String contenido, LocalTime horaIni, LocalTime horaFin) {
        List<Camion> camionesEnMantenimiento = new ArrayList<>();
        try {
            // Process content directly
            String[] lineas = contenido.split("\\r?\\n");
            for (String linea : lineas) {
                if (linea.trim().isEmpty() || linea.startsWith("#")) continue;
                
                String[] datos = linea.split(",");
                if (datos.length < 3) continue;
                
                String codigoCamion = datos[0].trim();
                String fechaStr = datos[1].trim();
                String descripcion = datos[2].trim();
                
                int idCamion = buscarIdCamionPorCodigo(codigoCamion);
                if (idCamion == -1) continue;
                
                Camion camion = flota.get(idCamion - 1);
                LocalDateTime fechaMantenimiento = conversorFecha(fechaStr, fechaHoraInicio);
                
                Mantenimiento mantenimiento = new Mantenimiento();
                mantenimiento.setCamion(camion);
                mantenimiento.setFechaHoraInicio(fechaMantenimiento.with(horaIni));
                mantenimiento.setFechaHoraFin(fechaMantenimiento.with(horaFin));
                mantenimiento.setDescripcion(descripcion);
                mantenimiento.setTipo(Mantenimiento.TipoMantenimiento.PREVENTIVO);
                
                if (camion.getMantenimientos() == null) {
                    camion.setMantenimientos(new ArrayList<>());
                }
                camion.getMantenimientos().add(mantenimiento);
                camionesEnMantenimiento.add(camion);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return camionesEnMantenimiento;
    }
    private int buscarIdCamionPorCodigo(String codigoCamion) {
        for (int i = 0; i < flota.size(); i++) {
            if (flota.get(i).getCodigo().equals(codigoCamion)) {
                return i;
            }
        }
        return -1;
    }


    public void cargarPedidos(String contenido) {
        try {
            // Process content directly
            String[] lineas = contenido.split("\\r?\\n");
            for (String linea : lineas) {
                if (linea.trim().isEmpty() || linea.startsWith("#")) continue;
                
                String[] datos = linea.split(",");
                if (datos.length < 6) continue;
                
                int idCliente = Integer.parseInt(datos[0].trim());
                String numeroPedido = datos[1].trim();
                double volumenGLP = Double.parseDouble(datos[2].trim());
                double posX = Double.parseDouble(datos[3].trim());
                double posY = Double.parseDouble(datos[4].trim());
                double tiempoMaxEntrega = Double.parseDouble(datos[5].trim());
                
                Pedido pedido = new Pedido();
                pedido.setId(pedidos.size() + 1);
                pedido.setIdCliente(idCliente);
                pedido.setNumeroPedido(numeroPedido);
                pedido.setVolumenGLP(volumenGLP);
                
                Nodo ubicacion = new Nodo(posX, posY);
                pedido.setUbicacion(ubicacion);
                
                pedido.setFechaHoraRegistro(fechaHoraInicio);
                pedido.setTiempoMaxEntrega(tiempoMaxEntrega);
                pedido.setFechaHoraMaxEntrega(fechaHoraInicio.plusHours((long)tiempoMaxEntrega));
                pedido.setEstado(EstadoPedido.PENDIENTE);
                pedido.setCompletado(false);
                
                pedidos.add(pedido);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    public void cargarAverias(String contenido) {
        try {
            // Process content directly
            String[] lineas = contenido.split("\\r?\\n");
            for (String linea : lineas) {
                if (linea.trim().isEmpty() || linea.startsWith("#")) continue;
                
                String[] datos = linea.split(",");
                if (datos.length < 4) continue;
                
                String codigoCamion = datos[0].trim();
                String fechaStr = datos[1].trim();
                int tipoAveriaId = Integer.parseInt(datos[2].trim());
                String descripcion = datos[3].trim();
                
                int idCamion = buscarIdCamionPorCodigo(codigoCamion);
                if (idCamion == -1) continue;
                
                Camion camion = flota.get(idCamion - 1);
                LocalDateTime fechaAveria = conversorFecha(fechaStr, fechaHoraInicio);
                
                TipoAveria tipoAveria = new TipoAveria();
                tipoAveria.setId(tipoAveriaId);
                
                if (tipoAveriaId == 1) { // Tipo 1: Avería leve
                    tipoAveria.setTiempoInmovilizado(2.0); // 2 horas
                    tipoAveria.setRegresaAlmacen(false);
                } else if (tipoAveriaId == 2) { // Tipo 2: Avería moderada
                    tipoAveria.setTiempoInmovilizado(8.0); // 8 horas
                    tipoAveria.setRegresaAlmacen(true);
                } else { // Tipo 3: Avería grave
                    tipoAveria.setTiempoInmovilizado(24.0); // 24 horas
                    tipoAveria.setRegresaAlmacen(true);
                }
                
                Averia averia = new Averia();
                averia.setCamion(camion);
                averia.setFechaHoraInicio(fechaAveria);
                averia.setTipo(tipoAveria);
                averia.determinarFechaFin(this);
                
                if (camion.getAverias() == null) {
                    camion.setAverias(new ArrayList<>());
                }
                camion.getAverias().add(averia);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    public void cargaBloqueos(String contenido){
        try {
            // Process content directly
            String[] lineas = contenido.split("\\r?\\n");
            for (String linea : lineas) {
                if (linea.trim().isEmpty() || linea.startsWith("#")) continue;
                
                String[] datos = linea.split(",");
                if (datos.length < 5) continue;
                
                String fechaInicioStr = datos[0].trim();
                String fechaFinStr = datos[1].trim();
                double posX1 = Double.parseDouble(datos[2].trim());
                double posY1 = Double.parseDouble(datos[3].trim());
                double posX2 = Double.parseDouble(datos[4].trim());
                double posY2 = Double.parseDouble(datos[5].trim());
                
                LocalDateTime fechaInicio = conversorFecha(fechaInicioStr, fechaHoraInicio);
                LocalDateTime fechaFin = conversorFecha(fechaFinStr, fechaHoraInicio);
                
                Bloqueo bloqueo = new Bloqueo();
                bloqueo.setFechaHoraInicio(fechaInicio);
                bloqueo.setFechaHoraFin(fechaFin);
                bloqueo.setActivo(true);
                
                // Crear nodos para el bloqueo
                Nodo nodo1 = new Nodo(posX1, posY1);
                Nodo nodo2 = new Nodo(posX2, posY2);
                
                List<Nodo> nodosBloqueados = encontrarTramo(nodo1, nodo2);
                bloqueo.setRutasBloqueadas(nodosBloqueados);
                
                if (bloqueos == null) {
                    bloqueos = new ArrayList<>();
                }
                bloqueos.add(bloqueo);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public Boolean puedeCargar(int idxcamion, Map<Integer, List<Integer>> asignacion, int ini, int fin){
        double cargaPorPedidos = 0.0;
        for(int i=ini; i<fin; i++){
            int idped = asignacion.get(idxcamion+1).get(i);
            if(pedidos.isEmpty())
                System.out.println("no hay pedidos.");
            cargaPorPedidos += pedidos.get(idped-1).getVolumenGLP();
        }
        return cargaPorPedidos < flota.get(idxcamion).getTipo().getCargaGLPMax() ||
                Math.abs(cargaPorPedidos - flota.get(idxcamion).getTipo().getCargaGLPMax()) < 0.001;
    }
    public void imprimirPlanificacion(){
        for(Camion camion1 : getFlota()){

            System.out.println("******************Camion: " + camion1.getId() + " Placa: " +camion1.getPlaca());
            System.out.println("Cantidad de gasolina empleada TOTAL CAMION: " + camion1.getCombustibleEmpleado());
            System.out.println("Cantidad de gasolina FINAL: " + camion1.getCombustibleActual());
            System.out.println("Cantidad de GLP FINAL: " + camion1.getCargaGLPActual());
            for(Destino destino : camion1.getDestinos()){
                destino.imprimir();

                System.out.println("Cantidad de gasolina empleada en ruta: " + destino.getRuta().getConsumoCombustible());
                System.out.println("Llegada: " + destino.getFechaHoraLlegada());
                System.out.println("Salida: " + destino.getFechaHoraSalida());
                if(destino instanceof EntregaPedido)
                    System.out.println("Entregas hasta las : " + destino.getPedido().getFechaHoraMaxEntrega());
                //if(destino.getRuta().getNodos() == null)System.out.println("Nodo inicial del camión");
                //else System.out.println("Ruta: " + destino.getRuta().getNodos());
                System.out.println("-------------------------------------------------------------------------");

            }
        }

        System.out.println("----------------------------Cisternas----------------------------");
        for (Cisterna cis : getCisternas()){
            if(cis.getOperacionesGLPCisterna()==null)continue;
            System.out.println("************************Cisterna en" + cis.getUbicacion());
            System.out.println("SALDO FINAL DE GLP" + cis.getCargaGLPActual());
            for(OperacionesGLPCisterna op : cis.getOperacionesGLPCisterna()){
                System.out.println("fecha Operacion:"+op.getFechaHoraOperacion());
                System.out.println("GLP Saldo"+op.getSaldoGLP());
                System.out.println("Camion ID:"+op.getCamion().getId());
                System.out.println("----------------------------------");
            }
        }
    }

    public boolean isReplanning() {
        return replanning;
    }

    public void setReplanning(boolean replanning) {
        this.replanning = replanning;
    }

    public LocalDateTime getAveriaStartTime() {
        return averiaStartTime;
    }

    public void setAveriaStartTime(LocalDateTime averiaStartTime) {
        this.averiaStartTime = averiaStartTime;
    }
    public static LocalDateTime conversorFecha(String str, LocalDateTime base) {
        try {
            // Try parsing as ISO format (yyyy-MM-dd'T'HH:mm:ss)
            if (str.contains("T")) {
                return LocalDateTime.parse(str);
            }
            
            // Try parsing as date only (yyyy-MM-dd)
            if (str.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return LocalDate.parse(str).atStartOfDay();
            }
            
            // Try parsing as legacy format with d/h/m notation
            if (str.contains("d") || str.contains("h") || str.contains("m")) {
                String[] tiempoPartes = str.replace("d", " ").replace("h", " ").replace("m", " ").split(" ");
                if (tiempoPartes.length >= 3) {
                    double dias = Double.parseDouble(tiempoPartes[0]);
                    double horas = Double.parseDouble(tiempoPartes[1]);
                    double minutos = Double.parseDouble(tiempoPartes[2]);
                    
                    return base.plusDays((long)dias)
                            .plusHours((long)horas)
                            .plusMinutes((long)minutos);
                }
            }
            
            // Try parsing as simple date format (yyyyMMdd)
            if (str.matches("\\d{8}")) {
                return LocalDate.parse(str, java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd")).atStartOfDay();
            }
            
            // Default fallback
            return base;
        } catch (Exception e) {
            e.printStackTrace();
            return base; // Return base date if parsing fails
        }
    }
}
