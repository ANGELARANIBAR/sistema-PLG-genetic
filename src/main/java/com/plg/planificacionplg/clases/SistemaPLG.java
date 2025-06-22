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
    private LocalDateTime fechaHoraPrimerColapso = null;

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


    public List<Camion> cargarMantenimientos(String rutaArchivo, LocalTime horaIni, LocalTime horaFin) {
        //List<Camion> flota = new ArrayList<>();
        try (BufferedReader br = new BufferedReader(new FileReader(rutaArchivo))) {
            String linea;
            while ((linea = br.readLine()) != null) {
                String[] partes = linea.split(":");
                LocalDate fecha = LocalDate.parse(partes[0], java.time.format.DateTimeFormatter.ofPattern("yyyyMMdd"));
                String codigoCamion = partes[1];
                Mantenimiento m = new Mantenimiento();
                m.setFechaHoraInicio(LocalDateTime.of(fecha, horaIni));
                m.setFechaHoraFin(LocalDateTime.of(fecha, horaFin));
                m.setTipo(Mantenimiento.TipoMantenimiento.PREVENTIVO);
                int idxCamion = buscarIdCamionPorCodigo(codigoCamion);
                if(idxCamion != -1){
                    if(flota.get(idxCamion).getMantenimientos()==null)flota.get(idxCamion).setMantenimientos(new ArrayList<>());
                    flota.get(idxCamion).getMantenimientos().add(m);
                }
            }
        } catch (IOException e) {
            System.out.println("Error al leer el archivo: " + e.getMessage());
        }

        return flota;
    }
    private int buscarIdCamionPorCodigo(String codigoCamion) {
        for (int i = 0; i < flota.size(); i++) {
            if (flota.get(i).getCodigo().equals(codigoCamion)) {
                return i;
            }
        }
        return -1;
    }


    public void cargarPedidos(String rutaArchivo) {

        try (BufferedReader br = new BufferedReader(new FileReader(rutaArchivo))) {
            if(pedidos==null)pedidos=new ArrayList<>();
            String linea;
            while ((linea = br.readLine()) != null) {
                String[] partes = linea.split(":");
                String[] tiempoPartes = partes[0].replace("d", " ").replace("h", " ").replace("m", " ").split(" ");

                double tiempoSolicitud = Double.parseDouble(tiempoPartes[0]) * 1440 + // Días a minutos
                        Double.parseDouble(tiempoPartes[1]) * 60 +  // Horas a minutos
                        Double.parseDouble(tiempoPartes[2]);        // Minutos

                String[] datos = partes[1].split(",");
                double x = Double.parseDouble(datos[0]);
                double y = Double.parseDouble(datos[1]);
                int idCliente = Integer.parseInt(datos[2].replace("c-", ""));
                double volumen = Double.parseDouble(datos[3].replace("m3", ""));
                double tiempoMaxEntrega = Double.parseDouble(datos[4].replace("h", "")) * 60; // Horas a minutos
                Pedido pedidoNuevo = new Pedido();
                pedidoNuevo.setId(pedidos.size()+1);
                pedidoNuevo.setIdCliente(idCliente);
                pedidoNuevo.setNumeroPedido("PED-00"+pedidos.size()+1);
                pedidoNuevo.setVolumenGLP(volumen);
                pedidoNuevo.setUbicacion(new Nodo(x, y));
                pedidoNuevo.setFechaHoraRegistro(fechaHoraInicio.plusMinutes((long)(tiempoSolicitud)));
                pedidoNuevo.setTiempoMaxEntrega(tiempoMaxEntrega);
                pedidoNuevo.setFechaHoraMaxEntrega(fechaHoraInicio.plusMinutes((long)(pedidoNuevo.getTiempoMaxEntrega()+tiempoSolicitud)));
                pedidoNuevo.setEstado(EstadoPedido.PENDIENTE);
                pedidoNuevo.setCompletado(false);
                pedidoNuevo.setCamiones(new ArrayList<>());
                pedidoNuevo.setConsumoCombustibleTotal(0);
                pedidos.add(pedidoNuevo);
            }
        } catch (IOException e) {
            System.out.println("Error al leer el archivo: " + e.getMessage());
        }

    }
    public void cargarAverias(String rutaArchivo) {
        TipoAveria tipoAveria1 = new TipoAveria();
        tipoAveria1.setId(1);
        tipoAveria1.setTiempoInmovilizado(2);
        tipoAveria1.setRegresaAlmacen(false);
        TipoAveria tipoAveria2 = new TipoAveria();
        tipoAveria2.setId(2);
        tipoAveria2.setTiempoInmovilizado(2);
        tipoAveria2.setRegresaAlmacen(true);
        TipoAveria tipoAveria3 = new TipoAveria();
        tipoAveria3.setId(3);
        tipoAveria3.setTiempoInmovilizado(4);
        tipoAveria3.setRegresaAlmacen(true);
        List<TipoAveria> tipos = new ArrayList<>();
        tipos.add(tipoAveria1);
        tipos.add(tipoAveria2);
        tipos.add(tipoAveria3);
        try (BufferedReader br = new BufferedReader(new FileReader(rutaArchivo))) {
            if(averias==null)averias=new ArrayList<>();
            String linea;
            while ((linea = br.readLine()) != null) {
                String[] partes = linea.split("_");
                int idAveria = Integer.parseInt(partes[0].replace("T", ""));
                int turno = Integer.parseInt(partes[2].replace("TI", ""));
                String codigoCamion = partes[1];
                Averia averiaNueva = new Averia();
                averiaNueva.setId(averias.size()+1);
                averiaNueva.setTipo(tipos.get(idAveria-1));
                averiaNueva.setTurnoOcurrencia(turno);
                int idxCamion = buscarIdCamionPorCodigo(codigoCamion);
                if(idxCamion != -1){
                    averiaNueva.setIdCamion(idxCamion);
                    flota.get(idxCamion).getAverias().add(averiaNueva);
                    averias.add(averiaNueva);
                }
            }
        } catch (IOException e) {
            System.out.println("Error al leer el archivo: " + e.getMessage());
        }

    }
    public void cargaBloqueos(String rutaArchivo){
        try (BufferedReader br = new BufferedReader(new FileReader(rutaArchivo))) {
            String linea;
            if(bloqueos==null)bloqueos = new ArrayList<>();
            if(fechaHoraInicio==null)return;
            while ((linea = br.readLine()) != null) {
                if (linea.trim().isEmpty()) continue;

                // Separar tiempo y coordenadas
                String[] partes = linea.split(":");
                if (partes.length != 2) continue;

                String tiempo = partes[0];
                String coordenadasStr = partes[1];

                // Separar inicio y fin
                String[] rango = tiempo.split("-");
                if (rango.length != 2) continue;

                String inicioStr = rango[0]; // por ejemplo "01d06h00m"
                String finStr = rango[1];    // por ejemplo "01d15h00m"

                String[] coordenadas = coordenadasStr.split(",");

                Bloqueo bloqueo = new Bloqueo();
                bloqueo.setFechaHoraInicio(conversorFecha(inicioStr, fechaHoraInicio));
                bloqueo.setFechaHoraFin(conversorFecha(finStr, fechaHoraInicio));
                bloqueo.setRutasBloqueadas(new ArrayList<>());
                int x, y;
                for (int i = 0; i < coordenadas.length; i += 2) {
                    x = Integer.parseInt(coordenadas[i].trim());
                    y = Integer.parseInt(coordenadas[i+1].trim());
                    Nodo bloqueado = new Nodo(x, y);
                    bloqueo.getRutasBloqueadas().add(bloqueado);
                }
                bloqueos.add(bloqueo);
            }
        } catch (IOException e) {
            System.err.println("Error al leer el archivo: " + e.getMessage());
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
        int dias = Integer.parseInt(str.substring(0, 2));
        int horas = Integer.parseInt(str.substring(3, 5));
        int minutos = Integer.parseInt(str.substring(6, 8));
        if(dias<1)dias=1;
        return base.plusDays(dias-1)
                .withHour(horas)
                .withMinute(minutos);
    }
}
