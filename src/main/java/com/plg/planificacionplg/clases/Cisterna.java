package com.plg.planificacionplg.clases;

import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Data
@Entity
@Table(name = "cisterna")
public class Cisterna {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private int id;
    
    @Column(name = "principal", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean principal;
    
    @Column(name = "capacidad_total", nullable = false)
    private double capacidadTotal;
    
    @Column(name = "carga_glp_actual", nullable = false, columnDefinition = "DOUBLE DEFAULT 0.0")
    private double cargaGLPActual;
    
    @Column(name = "hora_abastecimiento")
    private LocalTime horaAbastecimento;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ubicacion_id")
    private Nodo ubicacion;
    
    @OneToMany(mappedBy = "cisterna", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<OperacionesGLPCisterna> operacionesGLPCisterna;    
    
    public Cisterna() {
        principal = false;
        operacionesGLPCisterna = new ArrayList<>();
        cargaGLPActual = 0.0;
    }
    public Cisterna(Cisterna otro){
        id = otro.getId();
        principal = otro.isPrincipal();
        capacidadTotal = otro.getCapacidadTotal();
        cargaGLPActual = otro.getCargaGLPActual();
        horaAbastecimento = otro.getHoraAbastecimento();
        ubicacion = otro.getUbicacion();
        operacionesGLPCisterna = otro.getOperacionesGLPCisterna();
        /*operacionesGLPCisterna = new ArrayList<>();
        for(OperacionesGLPCisterna op : otro.operacionesGLPCisterna){
            OperacionesGLPCisterna nuevaOp = new OperacionesGLPCisterna();
            operacionesGLPCisterna.add(nuevaOp);
            nuevaOp.setCantSalidaGLP(op.getCantSalidaGLP());
            nuevaOp.setFechaHoraOperacion(op.getFechaHoraOperacion());
            nuevaOp.setSaldoGLP(op.getSaldoGLP());
            nuevaOp.setCisterna(op.getCisterna());
            nuevaOp.setCamion(op.getCamion());
        }*/
    }
    public boolean registrarRetiroGLP(LocalDateTime fechaHora, double cantidadSolicitada, Camion camion) {
        //rango de fechas sin abastecimento
        LocalDateTime abastecimientoHoy = fechaHora.toLocalDate().atTime(horaAbastecimento), limiteInferior;
        LocalDateTime abastecimientoManana = fechaHora.toLocalDate().plusDays(1).atTime(horaAbastecimento);
        LocalDateTime abastecimientoAyer = fechaHora.toLocalDate().minusDays(1).atTime(horaAbastecimento);

        // Registrar nueva operación
        OperacionesGLPCisterna nuevaOp = new OperacionesGLPCisterna(), temporal = new OperacionesGLPCisterna();
        nuevaOp.setFechaHoraOperacion(fechaHora);
        nuevaOp.setCantSalidaGLP(cantidadSolicitada);
        nuevaOp.setCamion(camion);
        //nuevaOp.setCisterna(this);

        int index = Collections.binarySearch(
                operacionesGLPCisterna,
                nuevaOp,
                Comparator.comparing(OperacionesGLPCisterna::getFechaHoraOperacion)
        );
        if (index < 0) {
            index = -index - 1;
        }
        if(!operacionesGLPCisterna.isEmpty()){
            //  D    x       AH   x    D     AM
            if(fechaHora.isBefore(abastecimientoHoy)) {
                temporal.setFechaHoraOperacion(abastecimientoHoy);
                limiteInferior = abastecimientoAyer;
            }else{
                temporal.setFechaHoraOperacion(abastecimientoManana);
                limiteInferior = abastecimientoHoy;
            }

            int indexUltOpDelDia = Collections.binarySearch(
                    operacionesGLPCisterna,
                    temporal,
                    Comparator.comparing(OperacionesGLPCisterna::getFechaHoraOperacion)
            );
            if(indexUltOpDelDia < 0){
                indexUltOpDelDia = -indexUltOpDelDia -1;
            }

            // Solo si hay operaciones anteriores
            OperacionesGLPCisterna anterior = (index > 0) ? operacionesGLPCisterna.get(index - 1) : null;
            if(anterior != null){
                if(anterior.getFechaHoraOperacion().isBefore(limiteInferior)){
                    anterior = null;
                }
            }
            // PARA ESTE CASO dia se considera 24 horas antes o despues d eun abastecimiento de almacen
            OperacionesGLPCisterna ultimaDelDia = (indexUltOpDelDia < operacionesGLPCisterna.size() + 1 && indexUltOpDelDia > 0)
                    ? operacionesGLPCisterna.get(indexUltOpDelDia - 1) : null;


            int tamanoOperacionesHoy = indexUltOpDelDia-index;
            if(ultimaDelDia == null){
                tamanoOperacionesHoy = 0; // el ultimo sera nueva operacion
            }
            if(anterior != null) {//ya se hizo el abastecimeinto
                if(ultimaDelDia!=null && ultimaDelDia.getSaldoGLP()<cantidadSolicitada){
                    return false;
                }
                nuevaOp.setSaldoGLP(anterior.getSaldoGLP()-cantidadSolicitada);
                if(tamanoOperacionesHoy>0){
                    for(int i = 0; i < tamanoOperacionesHoy; i++) {
                        operacionesGLPCisterna.get(index+i).setSaldoGLP(operacionesGLPCisterna.get(index+i).getSaldoGLP()-cantidadSolicitada);
                    }
                }
            }
            else{//recien se hace el abastecimento
                if(ultimaDelDia!=null){
                    if(ultimaDelDia.getSaldoGLP()<cantidadSolicitada)return false;
                }
                nuevaOp.setSaldoGLP(capacidadTotal-cantidadSolicitada);
                if(tamanoOperacionesHoy>0){
                    for(int i = 0; i < tamanoOperacionesHoy; i++) {
                        operacionesGLPCisterna.get(index+i).setSaldoGLP(operacionesGLPCisterna.get(index+i).getSaldoGLP()-cantidadSolicitada);
                    }
                }
            }
        }
        else{
            if(!fechaHora.isBefore(abastecimientoHoy)) {
                cargaGLPActual = capacidadTotal;
            }
            if(cargaGLPActual < cantidadSolicitada) return false; else nuevaOp.setSaldoGLP(cargaGLPActual-cantidadSolicitada);
        }
        operacionesGLPCisterna.add(index, nuevaOp);
        //cargaGLPActual = operacionesGLPCisterna.get(operacionesGLPCisterna.size()-1).getSaldoGLP();
        cargaGLPActual -= cantidadSolicitada;
        return true;
    }
    public boolean puedeRetirarGLP(LocalDateTime fechaHora, double cantidadSolicitada) {
        //rango de fechas sin abastecimento
        LocalDateTime abastecimientoHoy = fechaHora.toLocalDate().atTime(horaAbastecimento), limiteInferior;
        LocalDateTime abastecimientoManana = fechaHora.toLocalDate().plusDays(1).atTime(horaAbastecimento);
        LocalDateTime abastecimientoAyer = fechaHora.toLocalDate().minusDays(1).atTime(horaAbastecimento);

        // Registrar nueva operación
        OperacionesGLPCisterna nuevaOp = new OperacionesGLPCisterna(), temporal = new OperacionesGLPCisterna();
        nuevaOp.setFechaHoraOperacion(fechaHora);
        nuevaOp.setCantSalidaGLP(cantidadSolicitada);

        int index = Collections.binarySearch(
                operacionesGLPCisterna,
                nuevaOp,
                Comparator.comparing(OperacionesGLPCisterna::getFechaHoraOperacion)
        );
        if (index < 0) {
            index = -index - 1;
        }
        if(!operacionesGLPCisterna.isEmpty()){
            //  D    x       AH   x    D     AM
            if(fechaHora.isBefore(abastecimientoHoy)) {
                temporal.setFechaHoraOperacion(abastecimientoHoy);
                limiteInferior = abastecimientoAyer;
            }else{
                temporal.setFechaHoraOperacion(abastecimientoManana);
                limiteInferior = abastecimientoHoy;
            }

            int indexUltOpDelDia = Collections.binarySearch(
                    operacionesGLPCisterna,
                    temporal,
                    Comparator.comparing(OperacionesGLPCisterna::getFechaHoraOperacion)
            );
            if(indexUltOpDelDia < 0){
                indexUltOpDelDia = -indexUltOpDelDia -1;
            }

            // Solo si hay operaciones anteriores
            OperacionesGLPCisterna anterior = (index > 0) ? operacionesGLPCisterna.get(index - 1) : null;
            if(anterior != null){
                if(anterior.getFechaHoraOperacion().isBefore(limiteInferior)){
                    anterior = null;
                }
            }
            // PARA ESTE CASO dia se considera 24 horas antes o despues d eun abastecimiento de almacen
            OperacionesGLPCisterna ultimaDelDia = (indexUltOpDelDia < operacionesGLPCisterna.size() + 1 && indexUltOpDelDia > 0)
                    ? operacionesGLPCisterna.get(indexUltOpDelDia - 1) : null;


            int tamanoOperacionesHoy = indexUltOpDelDia-index;
            if(ultimaDelDia == null){
                tamanoOperacionesHoy = 0; // el ultimo sera nueva operacion
            }else if(ultimaDelDia.getSaldoGLP()<cantidadSolicitada){
                return false;
            }
            if(anterior != null) {//ya se hizo el abastecimeinto
                //nuevaOp.setSaldoGLP(anterior.getSaldoGLP()-cantidadSolicitada);
                //restar a lso siguinets
            }
            else{//recien se hace el abastecimento
                if(capacidadTotal<cantidadSolicitada)return false;
            }
        }
        else{
            if(!fechaHora.isBefore(abastecimientoHoy)) {
                if(capacidadTotal < cantidadSolicitada) return false;
            }else if(cargaGLPActual < cantidadSolicitada) return false;
        }
        return true;
    }

    public double calcularGLPActual(LocalDateTime fechaHora){
        if(operacionesGLPCisterna.isEmpty()){return getCargaGLPActual();}
        OperacionesGLPCisterna nuevaOp = new OperacionesGLPCisterna();
        nuevaOp.setFechaHoraOperacion(fechaHora);
        nuevaOp.setCantSalidaGLP(0.0);
        int index = Collections.binarySearch(
                operacionesGLPCisterna,
                nuevaOp,
                Comparator.comparing(OperacionesGLPCisterna::getFechaHoraOperacion)
        );
        if (index < 0) {
            index = -index - 1;
        }
        if(index==operacionesGLPCisterna.size()){
            return operacionesGLPCisterna.getLast().getSaldoGLP();
        }
        return operacionesGLPCisterna.get(index).getSaldoGLP() + operacionesGLPCisterna.get(index).getCantSalidaGLP();
    }


    public static void main(String[] args) {
        // Crear una cisterna
        Cisterna cisterna = new Cisterna();
        cisterna.setId(1);
        cisterna.setCapacidadTotal(10000.0);
        cisterna.setCargaGLPActual(8000.0);
        cisterna.setHoraAbastecimento(LocalTime.now().plusMinutes(4));

        // Crear un camión
        Camion camion = new Camion();
        camion.setId(1);
        camion.setPlaca("XYZ-123");
        for(int i = 0; i < 15; i++){

            // Simular una solicitud de retiro a las 08:30 del día actual
            LocalDateTime fechaHoraRetiro = LocalDateTime.now().plusHours(i*6);

            double cantidadSolicitada = 3000.0;

            // Intentar registrar el retiro
            boolean exito = cisterna.puedeRetirarGLP(fechaHoraRetiro, cantidadSolicitada);
            boolean exito1 = cisterna.registrarRetiroGLP(fechaHoraRetiro, cantidadSolicitada, camion);

            // Resultado
            if (exito1) {
                System.out.println("✅ 1Retiro registrado con éxito.");
            } else {
                System.out.println("❌ 1No hay suficiente GLP para ese horario.");
            }
            if (exito) {
                System.out.println("✅ Retiro registrado con éxito.");
            } else {
                System.out.println("❌ No hay suficiente GLP para ese horario.");
            }
        }

        // Mostrar operaciones registradas
        for (OperacionesGLPCisterna op : cisterna.getOperacionesGLPCisterna()) {
            System.out.println("🕒 " + op.getFechaHoraOperacion() +
                    " | 🚛 " + op.getCamion().getPlaca() +
                    " | 🔻 " + op.getCantSalidaGLP() +
                    " | 📦 Saldo: " + op.getSaldoGLP());
        }
    }

}