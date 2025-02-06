// Mostrar el modal con el mensaje adecuado
function showModal(message) {
  const modal = document.getElementById('modal');
  const modalMessage = document.getElementById('modalMessage');
  modalMessage.textContent = message;  // Set the message
  modal.style.display = 'flex';  // Show the modal
}

// Cerrar el modal
function closeModal() {
  const modal = document.getElementById('modal');
  modal.style.display = 'none';  // Hide the modal
  // Limpiar el formulario después de cerrar el modal
  document.getElementById("myForm").reset();  // Reset the form fields
}

// Función para manejar el envío del formulario
document.getElementById('myForm').addEventListener('submit', async (e) => {
  e.preventDefault();  // Evitar el comportamiento predeterminado del formulario

  const formData = new FormData(e.target);  // Recopilar los datos del formulario
  const payload = Object.fromEntries(formData.entries());  // Crear el objeto con los datos del formulario

  try {
      const response = await fetch('/invokeProcedure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Mostrar el mensaje en el modal
      showModal("Operación realizada correctamente.");

  } catch (error) {
      // Mostrar el mensaje de error en el modal
      showModal("Hubo un error al procesar la operación.");
  }
});

// No mostrar el modal al cargar la página
document.addEventListener("DOMContentLoaded", () => {
  // Asegurarse de que el modal esté oculto al cargar la página
  const modal = document.getElementById('modal');
  if (modal) {
      modal.style.display = 'none'; // Asegura que el modal esté oculto al principio
  }
});

// Función para obtener los códigos de cobro
async function getCodigosCobro() {
  try {
      const response = await fetch("/getCodigosCobro");
      if (!response.ok) {
          throw new Error("Error al obtener los códigos de cobro");
      }

      const codigos = await response.json();
      const lista = document.getElementById("codigo-lista");
      lista.innerHTML = ""; // Limpiar la lista existente

      if (codigos.data && codigos.data.length > 0) {
          codigos.data.forEach((codigo) => {
              const option = document.createElement("option");
              option.value = codigo.codigo;
              option.textContent = `${codigo.codigo} - ${codigo.descripcion}`;
              lista.appendChild(option);
          });
      } else {
          alert("No se encontraron códigos de cobro disponibles.");
      }
  } catch (error) {
      console.error("Error al obtener los códigos de cobro:", error);
      alert("Error al obtener los códigos de cobro. Intente nuevamente.");
  }
}

// Llamada automática para llenar los códigos de cobro cuando la página se carga
document.addEventListener("DOMContentLoaded", function () {
  // Comprobamos si el botón "Cancelar" existe antes de agregar el listener
  const cancelarBtn = document.getElementById("cancelar-btn");
  if (cancelarBtn) {
      cancelarBtn.addEventListener("click", function () {
          document.getElementById("myForm").reset();
      });
  } else {
      console.log("El botón cancelar no se encontró.");
  }

  // Mostramos los códigos de cobro cuando el input es clickeado
  const inputCodCobPag = document.getElementById("codCobPag");
  const codigoLista = document.getElementById("codigo-lista");

  inputCodCobPag.addEventListener("click", function () {
      // Mostrar la lista cuando se haga clic en el campo de entrada
      codigoLista.style.display = 'block';
      getCodigosCobro();  // Cargar los códigos de cobro solo cuando se haga clic
  });

  // Función para manejar la selección de un código de cobro
  codigoLista.addEventListener('change', function (event) {
      inputCodCobPag.value = event.target.value; // Asignar el valor seleccionado al input
      codigoLista.style.display = 'none'; // Ocultar la lista después de la selección
  });

  // Esta función es para cerrar la lista si el usuario hace clic fuera de ella
  document.addEventListener('click', function (e) {
      if (!inputCodCobPag.contains(e.target) && !codigoLista.contains(e.target)) {
          codigoLista.style.display = 'none';
      }
  });
});

// Función para obtener los códigos de motivo
async function getCodigosMotivo() {
  try {
      const response = await fetch("/getCodigosMotivo");
      if (!response.ok) {
          throw new Error("Error al obtener los códigos de motivo");
      }

      const motivos = await response.json();
      const lista = document.getElementById("motivo-lista");
      lista.innerHTML = ""; // Limpiar la lista existente

      if (motivos.data && motivos.data.length > 0) {
          motivos.data.forEach((motivo) => {
              const option = document.createElement("option");
              option.value = motivo.codigo;
              option.textContent = `${motivo.codigo} - ${motivo.descripcion}`;
              lista.appendChild(option);
          });
      } else {
          alert("No se encontraron códigos de motivo disponibles.");
      }
  } catch (error) {
      console.error("Error al obtener los códigos de motivo:", error);
      alert("Error al obtener los códigos de motivo. Intente nuevamente.");
  }
}

// Llamada automática para llenar los códigos de motivo cuando la página se carga
document.addEventListener("DOMContentLoaded", function () {
  // Mostramos los códigos de motivo cuando el input es clickeado
  const inputCodMtv = document.getElementById("codMtv");
  const motivoLista = document.getElementById("motivo-lista");

  inputCodMtv.addEventListener("click", function () {
      // Mostrar la lista cuando se haga clic en el campo de entrada
      motivoLista.style.display = 'block';
      getCodigosMotivo();  // Cargar los códigos de motivo solo cuando se haga clic
  });

  // Función para manejar la selección de un código de motivo
  motivoLista.addEventListener('change', function (event) {
      inputCodMtv.value = event.target.value; // Asignar el valor seleccionado al input
      motivoLista.style.display = 'none'; // Ocultar la lista después de la selección
  });

  // Esta función es para cerrar la lista si el usuario hace clic fuera de ella
  document.addEventListener('click', function (e) {
      if (!inputCodMtv.contains(e.target) && !motivoLista.contains(e.target)) {
          motivoLista.style.display = 'none';
      }
  });
});

// Función para filtrar las opciones de la lista desplegable
function filtrarOpciones(listaId, texto) {
  const lista = document.getElementById(listaId);
  const opciones = lista.getElementsByTagName('option');

  // Mostrar la lista si está oculta
  lista.style.display = 'block';

  // Recorrer todas las opciones y mostrar/ocultar según el texto
  for (let i = 0; i < opciones.length; i++) {
      const opcion = opciones[i];
      if (opcion.textContent.toLowerCase().includes(texto.toLowerCase())) {
          opcion.style.display = 'block'; // Mostrar la opción
      } else {
          opcion.style.display = 'none'; // Ocultar la opción
      }
  }

  // Si solo hay una opción visible, seleccionarla automáticamente
  const opcionesVisibles = Array.from(opciones).filter(opcion => opcion.style.display !== 'none');
  if (opcionesVisibles.length === 1) {
      lista.value = opcionesVisibles[0].value;
      document.getElementById(listaId === 'codigo-lista' ? 'codCobPag' : 'codMtv').value = opcionesVisibles[0].value;
      lista.style.display = 'none'; // Ocultar la lista después de seleccionar
  }
}