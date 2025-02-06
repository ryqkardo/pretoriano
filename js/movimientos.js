document.addEventListener("DOMContentLoaded", async () => {
    try {
        const response = await fetch("/api/movimientos");
        const data = await response.json();

        const tbody = document.querySelector("#tabla-movimientos tbody");
        const filtroInput = document.querySelector("#filtro-input");

        // Función para formatear el monto como moneda chilena (CLP)
        const formatearMonto = (monto) => {
            return new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
            }).format(monto);
        };

        // Función para renderizar la tabla con los datos proporcionados
        const renderTable = (data) => {
            tbody.innerHTML = "";

            data.forEach(mov => {
                const row = document.createElement("tr");

                row.innerHTML = `
                    <td>${mov.Numero_orden}</td>
                    <td>${mov.Responsable}</td>
                    <td>${mov.Modalidad}</td>
                    <td>${mov.Nombre_Tarjeta}</td>
                    <td>${new Date(mov.Fecha_Movimiento).toLocaleDateString()}</td>
                    <td>${formatearMonto(mov.Monto)}</td> <!-- Aquí aplicamos el formato -->
                    <td>${mov.Observacion || "-"}</td>
                    <td>${mov.Descripcion || "-"}</td>
                    <td><button class="eliminar-btn" data-numero-orden="${mov.Numero_orden}">Eliminar</button></td>
                `;

                tbody.appendChild(row);
            });

            // Agregar evento de clic a los botones de eliminación
            document.querySelectorAll(".eliminar-btn").forEach(button => {
                button.addEventListener("click", async () => {
                    const numeroOrden = button.getAttribute("data-numero-orden");

                    // Mostrar un mensaje de confirmación con SweetAlert2
                    const confirmacion = await Swal.fire({
                        title: "¿Estás seguro?",
                        text: "Esta acción eliminará el movimiento seleccionado.",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#d33",
                        cancelButtonColor: "#3085d6",
                        confirmButtonText: "Sí, eliminar",
                        cancelButtonText: "Cancelar",
                    });

                    if (confirmacion.isConfirmed) {
                        try {
                            const response = await fetch(`/eliminar-movimiento/${numeroOrden}`, {
                                method: "DELETE",
                            });

                            if (response.ok) {
                                // Mostrar mensaje de éxito
                                await Swal.fire({
                                    title: "¡Eliminado!",
                                    text: "El movimiento ha sido eliminado exitosamente.",
                                    icon: "success",
                                    confirmButtonText: "Aceptar",
                                });

                                // Recargar la página para actualizar la tabla
                                window.location.reload();
                            } else {
                                // Mostrar mensaje de error
                                await Swal.fire({
                                    title: "Error",
                                    text: "No se pudo eliminar el movimiento.",
                                    icon: "error",
                                    confirmButtonText: "Aceptar",
                                });
                            }
                        } catch (error) {
                            console.error("Error al eliminar el movimiento:", error);
                            // Mostrar mensaje de error
                            await Swal.fire({
                                title: "Error",
                                text: "Hubo un problema al eliminar el movimiento.",
                                icon: "error",
                                confirmButtonText: "Aceptar",
                            });
                        }
                    }
                });
            });
        };

        // Renderizar la tabla con todos los datos inicialmente
        renderTable(data);

        // Función para filtrar los movimientos
        const filtrarMovimientos = (texto) => {
            const textoMinuscula = texto.toLowerCase();
            const movimientosFiltrados = data.filter(mov => {
                return (
                    mov.Numero_orden.toString().toLowerCase().includes(textoMinuscula) ||
                    mov.Responsable.toLowerCase().includes(textoMinuscula) ||
                    mov.Modalidad.toLowerCase().includes(textoMinuscula) ||
                    mov.Nombre_Tarjeta.toLowerCase().includes(textoMinuscula) ||
                    mov.Observacion?.toLowerCase().includes(textoMinuscula) ||
                    mov.Descripcion?.toLowerCase().includes(textoMinuscula)
                );
            });

            renderTable(movimientosFiltrados);
        };

        // Escuchar el evento de entrada en el campo de búsqueda
        filtroInput.addEventListener("input", (e) => {
            filtrarMovimientos(e.target.value);
        });

    } catch (error) {
        console.error("Error cargando movimientos:", error);
        // Mostrar mensaje de error
        Swal.fire({
            title: "Error",
            text: "Hubo un problema al cargar los movimientos.",
            icon: "error",
            confirmButtonText: "Aceptar",
        });
    }
});