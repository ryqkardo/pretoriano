document.addEventListener('DOMContentLoaded', async () => {
  try {
    const response = await fetch('/api/estado-cuentas');
    const data = await response.json();

    const tbody = document.querySelector('#tabla-estado-cuentas tbody');
    tbody.innerHTML = ''; // Limpiar el contenido previo

    data.forEach(item => {
      const row = document.createElement('tr');

      // Crear la celda para "Estado"
      const estadoCell = document.createElement('td');
      estadoCell.textContent = item.EST_CTA;

      // Aplicar la clase si el estado es "PENDIENTE"
      if (item.EST_CTA === 'PENDIENTE') {
        estadoCell.classList.add('texto-pendiente');
      }

      // Crear la celda para "Descripción"
      const descripcionCell = document.createElement('td');
      descripcionCell.textContent = item.descripcion;

      // Agregar las celdas a la fila
      row.appendChild(estadoCell);
      row.appendChild(descripcionCell);

      // Agregar la fila a la tabla
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error('Error al obtener los datos:', error);
  }
});