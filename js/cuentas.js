document.addEventListener("DOMContentLoaded", function () {
    fetch('/api/saldos')
        .then(response => response.json())
        .then(data => {
            // Llenar la tabla de Banco Chile
            fillTable('banco-chile', data.bancoChile);
            // Llenar la tabla de Banco Falabella
            fillTable('banco-falabella', data.bancoFalabella);
            // Llenar la tabla de Lider BCI
            fillTable('lider-bci', data.liderBci);
            // Llenar la tabla de Tenpo
            fillTable('tenpo', data.tenpo);
        })
        .catch(error => console.error('Error al obtener los saldos:', error));
});

function fillTable(tableId, data) {
    const tableBody = document.querySelector(`#${tableId} tbody`);
    tableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla

    data.forEach(row => {
        const tr = document.createElement('tr');
        const tdDescripcion = document.createElement('td');
        const tdSaldo = document.createElement('td');

        tdDescripcion.textContent = row[0]; // Asumiendo que la descripción es el primer elemento
        tdSaldo.textContent = formatCurrency(row[1]); // Formatear el saldo como moneda chilena

        tr.appendChild(tdDescripcion);
        tr.appendChild(tdSaldo);
        tableBody.appendChild(tr);
    });
}

// Función para formatear un número como moneda chilena (CLP)
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0, // No mostrar decimales
    }).format(amount);
}

document.getElementById("grabarCarteraBtn").addEventListener("click", async () => {
    try {
        // Mostrar mensaje de carga con SweetAlert2
        Swal.fire({
            title: "Guardando...",
            text: "Por favor, espera mientras se graba la cartera.",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        const response = await fetch("/api/grabar-cartera", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });

        const result = await response.json();

        // Cerrar el mensaje de carga
        Swal.close();

        if (!response.ok) {
            throw new Error(result.error || "Error desconocido al grabar la cartera");
        }

        // Mostrar mensaje de éxito
        Swal.fire({
            icon: "success",
            title: "¡Éxito!",
            text: result.message,
            confirmButtonColor: "#4CAF50",
        });

    } catch (error) {
        console.error("❌ Error:", error);

        // Mostrar mensaje de error con SweetAlert2
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: `Hubo un error al grabar la cartera: ${error.message}`,
            confirmButtonColor: "#d33",
        });
    }
});

