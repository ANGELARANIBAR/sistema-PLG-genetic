import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import Simulacion from "./pages/Simulacion";
import Pedidos from "./pages/Pedidos";
import Planificacion from "./pages/Planificacion";
import NuevoPedido from "./pages/NuevoPedido";
import Flota from "./pages/Flota";
import NuevoVehiculo from "./pages/NuevoVehiculo";
import Simulador from "./pages/Simulador";
import Configuracion from "./pages/Configuracion";
import Home from "./pages/Home";
import BatchRefreshMonitor from "./components/BatchRefreshMonitor";

export default function App() {
  return (
    <>
      <BatchRefreshMonitor />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/simulacion" element={<Simulacion />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/flota" element={<Flota />} />
        <Route path="/configuracion" element={<Configuracion />} />
        <Route path="/planificacion" element={<Planificacion />} />
        <Route path="/nuevo-pedido" element={<NuevoPedido />} />
        <Route path="/nuevo-vehiculo" element={<NuevoVehiculo />} />
        <Route path="/visualizador" element={<Simulador />} />
      </Routes>
    </>
  );
}
