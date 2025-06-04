// src/App.tsx
import React from 'react';
import SimulationControl from './components/SimulationControl';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>GLP Route Simulation</h1>
      </header>
      <main>
        <SimulationControl />
      </main>
    </div>
  );
}

export default App;