package com.plg.planificacionplg.controller;

import com.plg.planificacionplg.PlanificacionPlgApplication;
import com.plg.planificacionplg.clases.*;
import com.plg.planificacionplg.dto.*;
import jakarta.persistence.criteria.CriteriaBuilder;
import org.springframework.cglib.core.Local;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/solution")
public class SolutionController {

    // Ruta base donde se guardarán los archivos
    private static final String BASE_UPLOAD_DIR = "src/main/java/com/plg/planificacionplg/test/";

    @GetMapping("/routes")
    public List<TruckRouteDTO> getRoutes() {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        
        if (mejorSolucion == null) {
            return new ArrayList<>();
        }

        return mejorSolucion.getSistemaPLG().getFlota().stream()
                .map(this::convertToTruckRouteDTO)
                .collect(Collectors.toList());
    }

    @PostMapping("/upload-files")
    public ResponseEntity<?> uploadFiles(
            @RequestParam(value = "pedidos", required = false) MultipartFile pedidosFile,
            @RequestParam(value = "averias", required = false) MultipartFile averiasFile,
            @RequestParam(value = "bloqueos", required = false) MultipartFile bloqueosFile,
            @RequestParam(value = "planmantenimiento", required = false) MultipartFile planMantenimientoFile) {
        
        Map<String, String> response = new HashMap<>();
        
        try {
            // Crear el directorio base si no existe
            File baseDir = new File(BASE_UPLOAD_DIR);
            if (!baseDir.exists()) {
                baseDir.mkdirs();
            }
            
            // Guardar cada archivo si fue proporcionado
            if (pedidosFile != null && !pedidosFile.isEmpty()) {
                saveFile(pedidosFile, "pedidos.txt");
                response.put("pedidos", "Archivo de pedidos guardado correctamente");
            }
            
            if (averiasFile != null && !averiasFile.isEmpty()) {
                saveFile(averiasFile, "averias.txt");
                response.put("averias", "Archivo de averías guardado correctamente");
            }
            
            if (bloqueosFile != null && !bloqueosFile.isEmpty()) {
                saveFile(bloqueosFile, "bloqueos.txt");
                response.put("bloqueos", "Archivo de bloqueos guardado correctamente");
            }
            
            if (planMantenimientoFile != null && !planMantenimientoFile.isEmpty()) {
                saveFile(planMantenimientoFile, "planmantenimiento.txt");
                response.put("planmantenimiento", "Archivo de plan de mantenimiento guardado correctamente");
            }
            
            if (response.isEmpty()) {
                return ResponseEntity.badRequest().body("No se proporcionó ningún archivo");
            }
            
            return ResponseEntity.ok(response);
            
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Error al guardar los archivos: " + e.getMessage());
        }
    }
    
    private void saveFile(MultipartFile file, String fileName) throws IOException {
        Path filePath = Paths.get(BASE_UPLOAD_DIR + fileName);
        Files.write(filePath, file.getBytes());
    }

    @GetMapping("/system")
    public SistemaPLGDTO getSystem() {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        
        if (mejorSolucion == null) {
            return null;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        SistemaPLGDTO dto = new SistemaPLGDTO();
        
        dto.setFlota(sistema.getFlota().stream()
                .map(this::convertToTruckRouteDTO)
                .collect(Collectors.toList()));
        
        dto.setCisternas(sistema.getCisternas().stream()
                .map(this::convertToCisternaDTO)
                .collect(Collectors.toList()));
        
        dto.setPedidos(sistema.getPedidos().stream()
                .map(this::convertToPedidoDTO)
                .collect(Collectors.toList()));

        dto.setBloqueos(sistema.getBloqueos().stream()
                .map(this::convertToBloqueoDTO)
                .collect(Collectors.toList()));
        
        dto.setDistanciaManzana(sistema.getDistanciaManzana());
        dto.setMaxXmapa(sistema.getMaxXmapa());
        dto.setMaxYmapa(sistema.getMaxYmapa());
        dto.setFechaHoraInicio(sistema.getFechaHoraInicio());
        dto.setAveriaStartTime(sistema.getAveriaStartTime());
        return dto;
    }

    @GetMapping("/truck-position/{truckId}")
    public NodeDTO getTruckPosition(
            @PathVariable int truckId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {
        
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return null;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        Camion camion = sistema.getFlota().stream()
                .filter(c -> c.getId() == truckId)
                .findFirst()
                .orElse(null);

        if (camion == null) {
            return null;
        }

        Nodo currentPosition = camion.calcularUbicacion(time);
        return new NodeDTO(currentPosition.getPosX(), currentPosition.getPosY());
    }
    @GetMapping("/truck-fuel/{truckId}")
    public double getTruckFuel(
            @PathVariable int truckId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {

        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return 0.0;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        Camion camion = sistema.getFlota().stream()
                .filter(c -> c.getId() == truckId)
                .findFirst()
                .orElse(null);

        if (camion == null) {
            return 0.0;
        }

        double currentFuel = camion.calcularCombustibleActual(time);
        return currentFuel;
    }

    @GetMapping("/truck-glp/{truckId}")
    public double getTruckGLP(
            @PathVariable int truckId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {

        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return 0.0;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        Camion camion = sistema.getFlota().stream()
                .filter(c -> c.getId() == truckId)
                .findFirst()
                .orElse(null);

        if (camion == null) {
            return 0.0;
        }

        double currentGLP = sistema.calcularGLPActual(truckId, time);
        return currentGLP;
    }

    @PostMapping("/{truckId}/registrarAveria")
    public void registrarAveria(
            @PathVariable int truckId,
            @RequestBody AveriaRequest request) {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        sistema.setReplanning(true);

        try {
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

            Averia a = new Averia();
            a.setIdCamion(truckId-1);
            a.setFechaHoraInicio(request.getFechaHoraInicioAveria());
            a.setTipo(tipos.get(request.getTipoAveria()-1));

            a.setTurnoOcurrencia(2);//no importa
            SistemaPLG replanificado = new SistemaPLG(mejorSolucion.getSistemaPLG());
            System.out.println("Iniciando Replanificación por Averia");
            Camion cam = mejorSolucion.getSistemaPLG().getCamionEnInstante(a.getIdCamion()+1, a.getFechaHoraInicio());
            if(cam!=null && cam.getEstado()==EstadoCamion.EN_RETORNO)return;

            for(Cisterna cist : mejorSolucion.getSistemaPLG().getCisternas()){
                OperacionesGLPCisterna op = new OperacionesGLPCisterna();
                op.setFechaHoraOperacion(a.getFechaHoraInicio().plusMinutes(1));
                int idxLastOpCis = Collections.binarySearch(
                        cist.getOperacionesGLPCisterna(),
                        op,
                        Comparator.comparing(OperacionesGLPCisterna::getFechaHoraOperacion)
                );

                if (idxLastOpCis < 0) {
                    idxLastOpCis = -idxLastOpCis - 1;
                }
                if (idxLastOpCis < cist.getOperacionesGLPCisterna().size()) {
                    cist.getOperacionesGLPCisterna().subList(idxLastOpCis, cist.getOperacionesGLPCisterna().size()).clear();
                }
            }
            replanificado.setCisternas(mejorSolucion.getSistemaPLG().getCisternas());
            LocalDateTime inicioAveria = a.getFechaHoraInicio();
            if(mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos().size()<2)return;

            mejorSolucion.getSistemaPLG().setReplanning(true);
            mejorSolucion.getSistemaPLG().setAveriaStartTime(inicioAveria);

            a.determinarFechaFin(mejorSolucion.getSistemaPLG());
            //cam.setEstado(EstadoCamion.AVERIADO);

            // Replanification process
            mejorSolucion.getSistemaPLG().estadoDePedidosALas(inicioAveria);
            replanificado.setFechaHoraInicio(inicioAveria);
            replanificado.setFlota(new ArrayList<>());
            replanificado.setPedidos(new ArrayList<>(mejorSolucion.getSistemaPLG().getPedidos()));
            replanificado.setCamionesAveriados(new ArrayList<>());
            replanificado.getCamionesAveriados().add(cam);
            replanificado.setCamionCausanteReplan(cam);
            cam.getAverias().add(a);
            Replanficacion origenReplan = new Replanficacion();
            origenReplan.setUbicacion(cam.getUbicacionActual());
            origenReplan.setFechaHoraLlegada(inicioAveria);
            origenReplan.setFechaHoraSalida(a.getFechaHoraFin());
            origenReplan.setGLPOperacion(0.0);
            if (mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos().isEmpty()) {
                mejorSolucion.getSistemaPLG().setReplanning(false);
                mejorSolucion.getSistemaPLG().setAveriaStartTime(null);
                return;
            }
            Destino destActuAveriado = mejorSolucion.getSistemaPLG().getFlota().get(a.getIdCamion()).getDestinos()
                    .get(cam.getIdxDestinoEnCurso());
            origenReplan.setSaldoGLPCamion(cam.calcularGLPActual(inicioAveria));
            origenReplan.setSaldoCombustibleCamion(cam.getCombustibleActual());
            origenReplan.setEstadoCamion(EstadoCamion.AVERIADO);
            if (cam.getEstado() != EstadoCamion.EN_RUTA) {
                if(destActuAveriado!=null)destActuAveriado.setEstadoCamion(EstadoCamion.AVERIADO);
                cam.getDestinos().add(destActuAveriado);
            } else cam.getDestinos().add(origenReplan);


            for (int i = 0; i < mejorSolucion.getSistemaPLG().getFlota().size(); i++) {
                //si el camion no tiene registro de atenciones en la planificaicon
                if (mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().size() < 3) {
                    //dar origen en cisterna principal
                    Camion nuevoCamion = new Camion(mejorSolucion.getSistemaPLG().getFlota().get(i));
                    Reabastecimiento origen = new Reabastecimiento();
                    origen.setCisterna(mejorSolucion.getSistemaPLG().getCisternas().get(0));
                    origen.setUbicacion(mejorSolucion.getSistemaPLG().getCisternas().get(0).getUbicacion());
                    origen.setFechaHoraSalida(replanificado.getFechaHoraInicio()); //primera solucion a evaluar
                    replanificado.getCisternas().get(0).registrarRetiroGLP(mejorSolucion.getSistemaPLG().getFechaHoraInicio(),
                            0.0, nuevoCamion);
                    nuevoCamion.setCargaGLPActual(0.0);
                    nuevoCamion.setCombustibleActual(nuevoCamion.getTipo().getCapCombustibleMax());
                    nuevoCamion.getDestinos().add(0, origen);
                    origen.setSaldoGLPCamion(0.0);
                    origen.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                    nuevoCamion.setEstado(EstadoCamion.DISPONIBLE);
                    //nuevoCamion.getDestinos().add(origen);
                    nuevoCamion.setUbicacionActual(origen.getUbicacion());
                    replanificado.getFlota().add(nuevoCamion);
                    System.out.println("camion que no salio> "+nuevoCamion.getId());
                    System.out.println("camion que no salio> "+nuevoCamion.getUbicacionActual());

                    continue;
                }
                if (i == a.getIdCamion()) {
                    replanificado.getFlota().add(cam);
                    continue;

                }
                Camion nuevoCamion = mejorSolucion.getSistemaPLG().getCamionEnInstante(i + 1, inicioAveria);
                nuevoCamion.setCargasGLP(new ArrayList<>());
                nuevoCamion.setDestinos(new ArrayList<>());
                Destino destinoActual = nuevoCamion.getDestinoEnCurso();
                if (destinoActual == null) {
                    //caso de los camiones que terminaron su ruta antes de la averia
                    destinoActual = mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().getLast().copiar();
                    nuevoCamion.getDestinos().add(destinoActual);
                    if(nuevoCamion.getDestinos().get(0).getFechaHoraSalida().isBefore(replanificado.getFechaHoraInicio())) {
                        // si el camion esta disponible antes del inicio de la averia, entoncs espera a que la averia ocurra
                        nuevoCamion.getDestinos().get(0).setFechaHoraSalida(replanificado.getFechaHoraInicio());
                    }
                    replanificado.getFlota().add(nuevoCamion);
                    System.out.println("camion en reposo> "+nuevoCamion.getId());
                    continue;
                }

                if (nuevoCamion.getEstado() != EstadoCamion.EN_RUTA && nuevoCamion.getEstado() != EstadoCamion.EN_RETORNO) {//despachando o recargando
                    nuevoCamion.getDestinos().add(destinoActual); //inicio, no es modificable en la construccion de rutas
                    System.out.println(nuevoCamion.getEstado());
                    System.out.println("camion que no esta en ruta> "+nuevoCamion.getId());
                    System.out.println("camion que no esta en ruta> "+nuevoCamion.getUbicacionActual());
                } else {
                    origenReplan = new Replanficacion();
                    origenReplan.setUbicacion(mejorSolucion.getSistemaPLG().getFlota().get(i).calcularUbicacion(inicioAveria));
                    origenReplan.setFechaHoraLlegada(inicioAveria);
                    origenReplan.setFechaHoraSalida(inicioAveria);
                    origenReplan.setGLPOperacion(0.0);
                    Destino anterior = mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinoAnteriorAFechaHora(inicioAveria);
                    if(anterior != null)
                        origenReplan.setSaldoGLPCamion(anterior.getSaldoGLPCamion());
                    else origenReplan.setSaldoGLPCamion(0.0);
                    origenReplan.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                    nuevoCamion.getDestinos().add(origenReplan);
                    System.out.println("camion en ruta> "+nuevoCamion.getId());
                    System.out.println("camion en ruta> "+nuevoCamion.getUbicacionActual());
                }
                replanificado.getFlota().add(nuevoCamion);
            }
            if(mejorSolucion.getSistemaPLG().getCamionesAveriados().isEmpty())
                mejorSolucion.getSistemaPLG().getCamionesAveriados().add(cam);//solo para la primera averia
            for(Camion c : mejorSolucion.getSistemaPLG().getCamionesAveriados()){
                int idcam = c.getId();
                Camion camAveriado  = replanificado.getFlota().get(idcam-1);
                if(camAveriado.getAverias()==null)camAveriado.setAverias(new ArrayList<>());
                if(cam.getId()!=camAveriado.getId())
                    replanificado.getCamionesAveriados().add(camAveriado);
                camAveriado.getAverias().add(c.getAverias().getLast());
                if (camAveriado.getAverias().getLast().getTipo().getId() == 1) {
                    camAveriado.setPedidosAsignados(new ArrayList<>());
                    for (Pedido p : mejorSolucion.getSistemaPLG().getFlota().get(camAveriado.getId()-1).getPedidosAsignados()) {
                        if (p.getEstado() == EstadoPedido.PENDIENTE) {
                            p.setEstado(EstadoPedido.ASIGNADO);//no pasan a replanificaion
                            camAveriado.getPedidosAsignados().add(p);
                        }
                    }
                } else camAveriado.setPedidosAsignados(new ArrayList<>());//caso 2 y 3 donde no atiende sino se va
            }
            int tamPoblacion = 30;
            int generaciones = 5;
            double probCruce = 0.3;
            double probMutacion = 0.15;
            double porcentajeElite = 0.2;
            //replanificado.imprimirPlanificacion();
            Genetico ga2 = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
            mejorSolucion = ga2.ejecutar(2, replanificado);
            mejorSolucion.getSistemaPLG().imprimirPlanificacion();

            mejorSolucion.getSistemaPLG().setReplanning(false);
            mejorSolucion.getSistemaPLG().setAveriaStartTime(null);

            PlanificacionPlgApplication.setMejorSolucion(mejorSolucion);


    } finally {
            sistema.setReplanning(false);
        }
    }
    @PostMapping("/{truckId}/{pedidoId}/change-state")
    public void cambiarEstadoPedido(
            @PathVariable int truckId,
            @PathVariable int pedidoId,
            @RequestBody String nuevoEstado) { // 🔹 Se recibe el nuevo estado en el cuerpo de la petición

        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        Camion camion = sistema.getFlota().stream()
                .filter(c -> c.getId() == truckId)
                .findFirst()
                .orElse(null);

        if (camion == null) {
            return;
        }

        Destino entregaPedido = (camion.getDestinos().stream())
                .filter(d ->  d instanceof EntregaPedido && ((EntregaPedido)d).getId() != 0 && ((EntregaPedido)d).getId() == pedidoId)
                .findFirst()
                .orElse(null);
        Pedido pedido = null;
        if(entregaPedido != null)pedido = entregaPedido.getPedido();
        if (pedido == null) {
            return;
        }
        System.out.println(nuevoEstado);
        //pedido.setEstado(EstadoPedido.valueOf(nuevoEstado)); // 🔹 Actualiza el estado del pedido
    }

    @GetMapping("/start-time")
    public LocalDateTime getStartTime() {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        return mejorSolucion != null ? mejorSolucion.getSistemaPLG().getFechaHoraInicio() : null;
    }

    @GetMapping("/is-replanning")
    public boolean isReplanning() {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        return mejorSolucion != null && mejorSolucion.getSistemaPLG().isReplanning();
    }

    @GetMapping("/truck-destination/{truckId}")
    public DestinationDTO getTruckDestination(
            @PathVariable int truckId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {
        
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return null;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        Camion camion = sistema.getCamionEnInstante(truckId, time);
        
        if (camion == null || camion.getDestinoEnCurso() == null) {
            return null;
        }

        return convertToDestinationDTO(camion.getDestinoEnCurso());
    }

    @GetMapping("/truck-state/{truckId}")
    public String getTruckState(
            @PathVariable int truckId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {
        Camion camion = PlanificacionPlgApplication.getMejorSolucion().getSistemaPLG()
                .getCamionEnInstante(truckId, time);
        return camion.getEstado().toString();
    }

    @PostMapping("/ejecutar-simulacion")
    public ResponseEntity<Individuo> ejecutarAlgoritmo() {
        new Thread(() -> {
            PlanificacionPlgApplication.ejecutarAlgoritmo(2); // Lógica pesada
        }).start();

        return ResponseEntity.accepted().build(); // 202 Accepted, sin esperar resultado
    }

    @PostMapping("/inicializar-fecha-hora")
    public ResponseEntity<String> inicializarFechaHora(@RequestBody FechaHoraInicioRequest request) {
        try {
            if (request.getFechaHoraInicio() == null) {
                return ResponseEntity.badRequest().body("fechaHoraInicio no puede ser null");
            }
            
            // Store the fechaHoraInicio in the application for later use
            PlanificacionPlgApplication.setFechaHoraInicio(request.getFechaHoraInicio());
            
            return ResponseEntity.ok("Fecha y hora inicializada correctamente: " + request.getFechaHoraInicio());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error al inicializar fecha y hora: " + e.getMessage());
        }
    }

    @PostMapping("/ejecutar-simulacion-con-fecha")
    public ResponseEntity<Individuo> ejecutarAlgoritmoConFecha(@RequestBody FechaHoraInicioRequest request) {
        if (request.getFechaHoraInicio() == null) {
            return ResponseEntity.badRequest().build();
        }
        
        // Set the fechaHoraInicio before executing the algorithm
        PlanificacionPlgApplication.setFechaHoraInicio(request.getFechaHoraInicio());
        
        new Thread(() -> {
            PlanificacionPlgApplication.ejecutarAlgoritmo(2); // Lógica pesada
        }).start();

        return ResponseEntity.accepted().build(); // 202 Accepted, sin esperar resultado
    }

    @PostMapping("/ejecutar-operacion-diaria-con-fecha")
    public ResponseEntity<Individuo> ejecutarAlgoritmoOperacionDiariaConFecha(@RequestBody FechaHoraInicioRequest request) {
        if (request.getFechaHoraInicio() == null) {
            return ResponseEntity.badRequest().build();
        }

        // Set the fechaHoraInicio before executing the algorithm
        PlanificacionPlgApplication.setFechaHoraInicio(request.getFechaHoraInicio());

        new Thread(() -> {

            PlanificacionPlgApplication.ejecutarAlgoritmo(1); // Lógica pesada
        }).start();

        return ResponseEntity.accepted().build(); // 202 Accepted, sin esperar resultado
    }

    @PostMapping("/ejecutar-colapso-con-fecha")
    public ResponseEntity<Individuo> ejecutarAlgoritmoColapsoConFecha(@RequestBody FechaHoraInicioRequest request) {
        if (request.getFechaHoraInicio() == null) {
            return ResponseEntity.badRequest().build();
        }

        // Set the fechaHoraInicio before executing the algorithm
        PlanificacionPlgApplication.setFechaHoraInicio(request.getFechaHoraInicio());

        new Thread(() -> {

            PlanificacionPlgApplication.ejecutarAlgoritmo(3); // Lógica pesada
        }).start();

        return ResponseEntity.accepted().build(); // 202 Accepted, sin esperar resultado
    }

    @GetMapping("/ejecutar-simulacion")
    public ResponseEntity<?> ejecutarSimulacion() {
        try {
            // Verificar que existan los archivos necesarios
            if (!Files.exists(Paths.get(BASE_UPLOAD_DIR + "pedidos.txt"))) {
                return ResponseEntity.badRequest().body("El archivo de pedidos no existe");
            }
            
            // Ejecutar el algoritmo de planificación
            PlanificacionPlgApplication.ejecutarAlgoritmo(2);
            
            return ResponseEntity.ok("Simulación ejecutada correctamente");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al ejecutar la simulación: " + e.getMessage());
        }
    }
    
    @GetMapping("/porcentaje-ejecucion")
    public double getPorcentajeEjecucion() {
        return PlanificacionPlgApplication.getPorcentajeEjecucion();
    }

    private DestinationDTO convertToDestinationDTO(Destino destino) {
        DestinationDTO dto = new DestinationDTO();
        dto.setArrivalTime(destino.getFechaHoraLlegada());
        dto.setDepartureTime(destino.getFechaHoraSalida());
        dto.setFuelConsumed(destino.getRuta().getConsumoCombustible());
        dto.setSaldoGLPCamion(destino.getSaldoGLPCamion());

        if (destino instanceof EntregaPedido) {
            dto.setDestinationType("ENTREGA PEDIDO");
            dto.setOrderId(destino.getPedido().getId());
            dto.setOrderNumber(destino.getPedido().getNumeroPedido());
            dto.setMaxDeliveryTime(destino.getPedido().getFechaHoraMaxEntrega());
        } else if (destino instanceof Reabastecimiento) {
            dto.setDestinationType("REABASTECIMIENTO");
        } else if (destino instanceof Trasvase) {
            dto.setDestinationType("TRASVASE");
        } else if (destino instanceof Replanficacion) {
            dto.setDestinationType("REPLANIFICACION");
        }
        
        if (destino.getEstadoCamion() != null) {
            dto.setDestinationType(destino.getEstadoCamion().toString());
        }
        
        if (destino.getRuta() != null && destino.getRuta().getNodos() != null) {
            dto.setRoute(destino.getRuta().getNodos().stream()
                    .map(node -> new NodeDTO(node.getPosX(), node.getPosY()))
                    .collect(Collectors.toList()));
        }
        
        return dto;
    }

    private TruckRouteDTO convertToTruckRouteDTO(Camion camion) {
        TruckRouteDTO dto = new TruckRouteDTO();
        dto.setTruckId(camion.getId());
        dto.setPlate(camion.getPlaca());
        dto.setFuelConsumed(camion.getCombustibleEmpleado());
        dto.setCurrentFuel(camion.getCombustibleActual());
        dto.setCurrentGLP(camion.getCargaGLPActual());
        dto.setCodigo(camion.getCodigo());

        List<DestinationDTO> destinations = new ArrayList<>();
        for (Destino destino : camion.getDestinos()) {
            DestinationDTO destDto = new DestinationDTO();
            destDto.setArrivalTime(destino.getFechaHoraLlegada());
            destDto.setDepartureTime(destino.getFechaHoraSalida());
            destDto.setFuelConsumed(destino.getRuta().getConsumoCombustible());
            destDto.setSaldoGLPCamion(destino.getSaldoGLPCamion());

            if (destino instanceof EntregaPedido) {
                destDto.setDestinationType("ENTREGA PEDIDO");
                destDto.setOrderId(destino.getPedido().getId());
                destDto.setOrderNumber(destino.getPedido().getNumeroPedido());
                destDto.setMaxDeliveryTime(destino.getPedido().getFechaHoraMaxEntrega());
            } else if (destino instanceof Reabastecimiento) {
                destDto.setDestinationType("REABASTECIMIENTO");
            } else if (destino instanceof Trasvase) {
                destDto.setDestinationType("TRASVASE");
            }
            else if (destino instanceof Replanficacion) {
                destDto.setDestinationType("REPLANIFICACION");
            }
            if(destino.getEstadoCamion()!=null)
                destDto.setDestinationType(destino.getEstadoCamion().toString());
            if (destino.getRuta() != null && destino.getRuta().getNodos() != null) {
                destDto.setRoute(destino.getRuta().getNodos().stream()
                        .map(node -> new NodeDTO(node.getPosX(), node.getPosY()))
                        .collect(Collectors.toList()));
            }
            
            destinations.add(destDto);
        }
        
        dto.setDestinations(destinations);
        return dto;
    }

    private CisternaDTO convertToCisternaDTO(Cisterna cisterna) {
        CisternaDTO dto = new CisternaDTO();
        dto.setId(cisterna.getId());
        dto.setPrincipal(cisterna.isPrincipal());
        dto.setCargaGLPActual(cisterna.getCargaGLPActual());
        dto.setCapacidadTotal(cisterna.getCapacidadTotal());
        dto.setUbicacion(new NodeDTO(cisterna.getUbicacion().getPosX(), cisterna.getUbicacion().getPosY()));
        dto.setHoraAbastecimento(cisterna.getHoraAbastecimento());
        return dto;
    }

    private PedidoDTO convertToPedidoDTO(Pedido pedido) {
        PedidoDTO dto = new PedidoDTO();
        dto.setId(pedido.getId());
        dto.setNumeroPedido(pedido.getNumeroPedido());
        dto.setVolumenGLP(pedido.getVolumenGLP());
        dto.setUbicacion(new NodeDTO(pedido.getUbicacion().getPosX(), pedido.getUbicacion().getPosY()));
        dto.setFechaHoraRegistro(pedido.getFechaHoraRegistro());
        dto.setTiempoMaxEntrega(pedido.getTiempoMaxEntrega());
        dto.setFechaHoraMaxEntrega(pedido.getFechaHoraMaxEntrega());
        dto.setEstado(pedido.getEstado().toString());
        dto.setCompletado(pedido.isCompletado());
        dto.setConsumoCombustibleTotal(pedido.getConsumoCombustibleTotal());
        return dto;
    }

    private BloqueoDTO convertToBloqueoDTO(Bloqueo bloqueo) {
        BloqueoDTO dto = new BloqueoDTO();
        dto.setFechaHoraInicio(bloqueo.getFechaHoraInicio());
        dto.setFechaHoraFin(bloqueo.getFechaHoraFin());
        dto.setRutasBloqueadas(bloqueo.getRutasBloqueadas().stream()
                .map(node -> new NodeDTO(node.getPosX(), node.getPosY()))
                .collect(Collectors.toList()));
        return dto;
    }

    @PostMapping("/registrarPedidosNuevos")
    public void registrarPedidosNuevos(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime inicioReplan,
            @RequestBody List<PedidoDTO> listaPedidosdto) {
        List<Pedido>pedidosnuevos = new ArrayList<>();
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null || listaPedidosdto == null || listaPedidosdto.isEmpty()) {
            return;
        }
        int cantPedidosActual = mejorSolucion.getSistemaPLG().getPedidos().size();
        for(PedidoDTO pedidoDTO : listaPedidosdto) {
            Pedido pedido = new Pedido();
            pedido.setId(++cantPedidosActual);
            pedido.setNumeroPedido(pedidoDTO.getNumeroPedido());
            pedido.setVolumenGLP(pedidoDTO.getVolumenGLP());
            pedido.setUbicacion(new Nodo(pedidoDTO.getUbicacion().getX(), pedidoDTO.getUbicacion().getY()));
            pedido.setFechaHoraRegistro(pedidoDTO.getFechaHoraRegistro());
            pedido.setFechaHoraMaxEntrega(pedidoDTO.getFechaHoraMaxEntrega());
            pedido.setEstado(EstadoPedido.PENDIENTE);
            pedido.setCompletado(false);
            pedido.setConsumoCombustibleTotal(0.0);
            pedidosnuevos.add(pedido);
        }
        SistemaPLG replanificado = new SistemaPLG(mejorSolucion.getSistemaPLG());
        replanificado.getPedidos().addAll(pedidosnuevos);
        replanificado.setCisternas(mejorSolucion.getSistemaPLG().getCisternas());
        mejorSolucion.getSistemaPLG().setReplanning(true);
        mejorSolucion.getSistemaPLG().setAveriaStartTime(inicioReplan);
        // Replanification process
        mejorSolucion.getSistemaPLG().estadoDePedidosALas(inicioReplan);
        replanificado.setFlota(new ArrayList<>());
        replanificado.setPedidos(new ArrayList<>(mejorSolucion.getSistemaPLG().getPedidos()));
        replanificado.setFechaHoraInicio(inicioReplan);
        replanificado.setCamionCausanteReplan(null);
        try{
            for (int i = 0; i < mejorSolucion.getSistemaPLG().getFlota().size(); i++) {
                //si el camion no tiene registro de atenciones en la planificaicon
                if (mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().size() < 3) {
                    //dar origen en cisterna principal
                    Camion nuevoCamion = new Camion(mejorSolucion.getSistemaPLG().getFlota().get(i));
                    Reabastecimiento origen = new Reabastecimiento();
                    origen.setCisterna(mejorSolucion.getSistemaPLG().getCisternas().get(0));
                    origen.setUbicacion(mejorSolucion.getSistemaPLG().getCisternas().get(0).getUbicacion());
                    origen.setFechaHoraSalida(replanificado.getFechaHoraInicio()); //primera solucion a evaluar
                    replanificado.getCisternas().get(0).registrarRetiroGLP(mejorSolucion.getSistemaPLG().getFechaHoraInicio(),
                            0.0, nuevoCamion);
                    nuevoCamion.setCargaGLPActual(0.0);
                    nuevoCamion.setCombustibleActual(nuevoCamion.getTipo().getCapCombustibleMax());
                    nuevoCamion.getDestinos().add(0, origen);
                    origen.setSaldoGLPCamion(0.0);
                    origen.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                    nuevoCamion.setEstado(EstadoCamion.DISPONIBLE);
                    //nuevoCamion.getDestinos().add(origen);
                    nuevoCamion.setUbicacionActual(origen.getUbicacion());
                    replanificado.getFlota().add(nuevoCamion);
                    System.out.println("camion que no salio> "+nuevoCamion.getId());
                    System.out.println("camion que no salio> "+nuevoCamion.getUbicacionActual());

                    continue;
                }
                Camion nuevoCamion = mejorSolucion.getSistemaPLG().getCamionEnInstante(i + 1, inicioReplan);
                nuevoCamion.setCargasGLP(new ArrayList<>());
                nuevoCamion.setDestinos(new ArrayList<>());
                Destino destinoActual = nuevoCamion.getDestinoEnCurso();
                if (destinoActual == null) {
                    //caso de los camiones que terminaron su ruta antes de la averia
                    destinoActual = mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinos().getLast().copiar();
                    nuevoCamion.getDestinos().add(destinoActual);
                    if(nuevoCamion.getDestinos().get(0).getFechaHoraSalida().isBefore(replanificado.getFechaHoraInicio())) {
                        // si el camion esta disponible antes del inicio de la averia, entoncs espera a que la averia ocurra
                        nuevoCamion.getDestinos().get(0).setFechaHoraSalida(replanificado.getFechaHoraInicio());
                    }
                    replanificado.getFlota().add(nuevoCamion);
                    System.out.println("camion en reposo> "+nuevoCamion.getId());
                    continue;
                }

                if (nuevoCamion.getEstado() != EstadoCamion.EN_RUTA && nuevoCamion.getEstado() != EstadoCamion.EN_RETORNO) {//despachando o recargando
                    nuevoCamion.getDestinos().add(destinoActual); //inicio, no es modificable en la construccion de rutas
                    System.out.println(nuevoCamion.getEstado());
                    System.out.println("camion que no esta en ruta> "+nuevoCamion.getId());
                    System.out.println("camion que no esta en ruta> "+nuevoCamion.getUbicacionActual());
                } else {
                    Destino origenReplan = new Replanficacion();
                    origenReplan.setUbicacion(mejorSolucion.getSistemaPLG().getFlota().get(i).calcularUbicacion(inicioReplan));
                    origenReplan.setFechaHoraLlegada(inicioReplan);
                    origenReplan.setFechaHoraSalida(inicioReplan);
                    origenReplan.setGLPOperacion(0.0);
                    Destino anterior = mejorSolucion.getSistemaPLG().getFlota().get(i).getDestinoAnteriorAFechaHora(inicioReplan);
                    if(anterior != null)
                        origenReplan.setSaldoGLPCamion(anterior.getSaldoGLPCamion());
                    else origenReplan.setSaldoGLPCamion(0.0);
                    origenReplan.setSaldoCombustibleCamion(nuevoCamion.getCombustibleActual());
                    nuevoCamion.getDestinos().add(origenReplan);
                    System.out.println("camion en ruta> "+nuevoCamion.getId());
                    System.out.println("camion en ruta> "+nuevoCamion.getUbicacionActual());
                }
                replanificado.getFlota().add(nuevoCamion);
            }
            int tamPoblacion = 30;
            int generaciones = 5;
            double probCruce = 0.3;
            double probMutacion = 0.15;
            double porcentajeElite = 0.2;
            replanificado.imprimirPlanificacion();
            Genetico ga2 = new Genetico(tamPoblacion, generaciones, probCruce, probMutacion, porcentajeElite);
            mejorSolucion = ga2.ejecutar(2, replanificado);
            mejorSolucion.getSistemaPLG().imprimirPlanificacion();

            mejorSolucion.getSistemaPLG().setReplanning(false);
            mejorSolucion.getSistemaPLG().setAveriaStartTime(null);

            PlanificacionPlgApplication.setMejorSolucion(mejorSolucion);


        } finally {
            mejorSolucion.getSistemaPLG().setReplanning(false);
        }
    }
    @GetMapping("/cisterna-GLP/{cisternaId}")
    public double getCisternaGLP(
            @PathVariable int cisternaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {

        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return 0.0;
        }

        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        Cisterna cisterna = sistema.getCisternas().stream()
                .filter(c -> c.getId() == cisternaId)
                .findFirst()
                .orElse(null);

        if (cisterna == null) {
            return 0.0;
        }
        return cisterna.calcularGLPActual(time);
    }
    @GetMapping("/porcentajeSimulacion/{simulacionId}")
    public double getPorcentajeSimulacion(
            @PathVariable int simulacionId) {

        return PlanificacionPlgApplication.getPorcentajeEjecucion();
    }
    @GetMapping("/estado-pedido/{pedidoId}")
    public String getEstadoPedido(
            @PathVariable int pedidoId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime time) {

        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null) {
            return "INEXISTENTE";
        }
        if(pedidoId>mejorSolucion.getSistemaPLG().getPedidos().size())return "ENTREGADO";
        Pedido p = mejorSolucion.getSistemaPLG().getPedidos().get(pedidoId-1);
        if(p != null && p.getFechaHoraEntrega()!=null) {
            if(!p.getFechaHoraEntrega().plusMinutes(15).isAfter(time)){
                return "ENTREGADO";
            }
            else{
                return "PENDIENTE";
            }
        }
        return "PENDIENTE";
    }
    @GetMapping("/upload-files-status")
    public ResponseEntity<Map<String, Boolean>> getFilesStatus() {
        Map<String, Boolean> filesStatus = new HashMap<>();
        
        // Verificar si cada archivo existe
        filesStatus.put("pedidos", Files.exists(Paths.get(BASE_UPLOAD_DIR + "pedidos.txt")));
        filesStatus.put("averias", Files.exists(Paths.get(BASE_UPLOAD_DIR + "averias.txt")));
        filesStatus.put("bloqueos", Files.exists(Paths.get(BASE_UPLOAD_DIR + "bloqueos.txt")));
        filesStatus.put("planmantenimiento", Files.exists(Paths.get(BASE_UPLOAD_DIR + "planmantenimiento.txt")));
        
        return ResponseEntity.ok(filesStatus);
    }

    @GetMapping("/fecha-hora-fin-entregas")
    public LocalDateTime getFechaHoraFinEntregas() {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        if (mejorSolucion == null || mejorSolucion.getSistemaPLG() == null) return null;
        return mejorSolucion.getSistemaPLG().getFechaHoraFinEntregas();
    }

    @PostMapping("/continue-simulation")
    public ResponseEntity<String> continueSimulation() {
        try {
            PlanificacionPlgApplication.procesarSiguienteBatch();

            return ResponseEntity.badRequest().body("No hay simulación activa");
//            Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
//            if (mejorSolucion == null || mejorSolucion.getSistemaPLG() == null) {
//                return ResponseEntity.badRequest().body("No hay simulación activa");
//            }
//            int batchActual = PlanificacionPlgApplication.getBatchActual();
//            List<Integer> batchStartIndices = PlanificacionPlgApplication.getBatchStartIndices();
//            List<Pedido> listaPedidosTotal = PlanificacionPlgApplication.getListaPedidosTotal();
//            if (batchStartIndices == null || batchActual >= batchStartIndices.size()) {
//                return ResponseEntity.ok("No hay más batches para procesar");
//            }
//            if(mejorSolucion.getSistemaPLG().getFechaHoraPrimerColapso()!=null){
//                System.out.println("Fecha y hora del primer colapso logístico: " + mejorSolucion.getSistemaPLG().getFechaHoraPrimerColapso());
//                System.out.println("Pedido causante del colapso: " + mejorSolucion.getSistemaPLG().getDestinoColapso().getPedido().getId());
//                System.out.println("Limite de entrega: " + mejorSolucion.getSistemaPLG().getDestinoColapso().getPedido().getFechaHoraMaxEntrega());
//                System.out.println("Hora simulada de entrega: " + mejorSolucion.getSistemaPLG().getDestinoColapso().getFechaHoraLlegada());
//                System.out.println("Entrega a cargo del camion: " + mejorSolucion.getSistemaPLG().getDestinoColapso().getPedido().getCamiones().getLast().getCodigo());
//
//                return ResponseEntity.ok("Colapso logístico alcanzado");
//            }
//            LocalDateTime inicio = mejorSolucion.getSistemaPLG().getFechaHoraFinEntregas();
//            int inicioBatch = batchStartIndices.get(batchActual);
//            System.out.println("Procesando batch Nro: " + (batchActual + 1));
//            int finBatch = (batchActual + 1 < batchStartIndices.size()) ? batchStartIndices.get(batchActual + 1) : listaPedidosTotal.size();
//            if (inicioBatch >= finBatch || inicioBatch >= listaPedidosTotal.size()) {
//                return ResponseEntity.ok("No hay más batches para procesar");
//            }
//            PlanificacionPlgApplication.setBatchActual(batchActual + 1);
//            List<Pedido> batch = listaPedidosTotal.subList(inicioBatch, finBatch);
//            ArrayList<Pedido> pedidosNuevos = new ArrayList<>(batch);
//            // Reasignar IDs para el batch
//            for (int j = 0; j < pedidosNuevos.size(); j++) {
//                pedidosNuevos.get(j).setId(j + 1); // o j si prefieres que empiece en 0
//            }
//            System.out.println("Cantidad pedidos: " + pedidosNuevos.size());
//            PlanificacionPlgApplication.replanificar(PlanificacionPlgApplication.getMejorSolucion(), inicio, pedidosNuevos);
//            return ResponseEntity.ok("Simulación continuada al siguiente batch");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error al continuar la simulación: " + e.getMessage());
        }
    }

    /**
     * Returns info about the first logistics collapse (primer colapso) if it exists.
     */
    @GetMapping("/primer-colapso-info")
    public ResponseEntity<Map<String, Object>> getPrimerColapsoInfo() {
        Individuo mejorSolucion = PlanificacionPlgApplication.getMejorSolucion();
        Map<String, Object> response = new HashMap<>();
        if (mejorSolucion == null || mejorSolucion.getSistemaPLG() == null) {
            response.put("colapso", false);
            response.put("pauseSimulation", false);
            return ResponseEntity.ok(response);
        }
        SistemaPLG sistema = mejorSolucion.getSistemaPLG();
        if (sistema.getFechaHoraPrimerColapso() != null && sistema.getDestinoColapso() != null && sistema.getDestinoColapso().getPedido() != null) {
            response.put("colapso", true);
            response.put("fechaHoraPrimerColapso", sistema.getFechaHoraPrimerColapso());
            response.put("pedidoCausanteId", sistema.getDestinoColapso().getPedido().getId());
            response.put("limiteEntrega", sistema.getDestinoColapso().getPedido().getFechaHoraMaxEntrega());
            response.put("horaSimuladaEntrega", sistema.getDestinoColapso().getFechaHoraLlegada());
            List<Camion> camiones = sistema.getDestinoColapso().getPedido().getCamiones();
            String camionCodigo = (camiones != null && !camiones.isEmpty()) ? camiones.get(camiones.size() - 1).getCodigo() : null;
            response.put("camionEntrega", camionCodigo);
            response.put("pauseSimulation", true);
        } else {
            response.put("colapso", false);
            response.put("pauseSimulation", false);
        }
        return ResponseEntity.ok(response);
    }
} 