document.getElementById("formReporte").addEventListener("submit", async function(event) {
    event.preventDefault();

    const mes = document.getElementById("mes").value;
    const anio = document.getElementById("anio").value;
    const tablaBody = document.querySelector("#tablaReporte tbody");

            // Función para formatear el monto como moneda chilena (CLP)
            const formatearMonto = (monto) => {
                return new Intl.NumberFormat('es-CL', {
                    style: 'currency',
                    currency: 'CLP',
                }).format(monto);
            };
    
    try {
        const response = await fetch(`/reporte?mes=${mes}&anio=${anio}`);
        const data = await response.json();

        if (data.error) {
            Swal.fire({ icon: 'error', title: 'Error', text: data.error });
        } else {
            tablaBody.innerHTML = ""; // Limpiar la tabla antes de agregar los nuevos datos
            
            const categorias = [
                { nombre: "Restaurantes", valor: data.restaurants },
                { nombre: "Supermercado", valor: data.supermercado },
                { nombre: "Bencina", valor: data.bencina },
                { nombre: "Automóvil", valor: data.automovil },
                { nombre: "Deportes", valor: data.deportes },
                { nombre: "Intereses", valor: data.intereses },
                { nombre: "Transportes", valor: data.transportes },
                { nombre: "Medicina", valor: data.medicina },
                { nombre: "Vestuario", valor: data.vestuario },
                { nombre: "Hogar", valor: data.hogar },
                { nombre: "Ocio", valor: data.ocio },
                { nombre: "Otros", valor: data.otros }
            ];
            
            categorias.forEach(cat => {
                if (cat.valor !== undefined) {
                    const row = `<tr><td>${cat.nombre}</td>
                    <td>${formatearMonto(cat.valor)}</td> <!-- Aquí aplicamos el formato -->`; 
                    tablaBody.innerHTML += row;
                }
            });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'Error en la solicitud' });
        console.error(error);
    }
});
