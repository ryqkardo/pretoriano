const express = require('express');
const oracledb = require('oracledb');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const PORT = 3000;

// Configurar Oracle Instant Client
oracledb.initOracleClient({ libDir: "C:\\oracle\\instantclient_23_6" });  // Ruta correcta al Instant Client


app.use(express.json());
app.use(express.static('public'));

// Mensaje de depuración
app.use((req, res, next) => {
  console.log(`Solicitud recibida: ${req.url}`);
  next();
});

// Función para manejar la conexión a Oracle
const connectToOracle = async () => {
  process.env.TNS_ADMIN = "C:\\Oracle\\Wallet_lamora";
  return oracledb.getConnection({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING,
  });
};

// Función para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return `${date.getUTCDate().toString().padStart(2, '0')}-${(date.getUTCMonth() + 1)
    .toString()
    .padStart(2, '0')}-${date.getUTCFullYear()} ${date.getUTCHours()
    .toString()
    .padStart(2, '0')}:${date.getUTCMinutes()
    .toString()
    .padStart(2, '0')}:${date.getUTCSeconds().toString().padStart(2, '0')}`;
};

// ************* Ruta para manejar el login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const connection = await connectToOracle();

    // Consulta para verificar las credenciales en la tabla ADMIN.tg_epl
    const result = await connection.execute(
      `SELECT * FROM ADMIN.tg_epl WHERE username = :username AND password = :password`,
      { username, password }
    );

    await connection.close();

    if (result.rows.length > 0) {
      // Si se encuentra un usuario con las credenciales proporcionadas
      res.json({ success: true });
    } else {
      // Si no se encuentra un usuario con las credenciales proporcionadas
      res.json({ success: false });
    }
  } catch (err) {
    console.error('Error al verificar las credenciales:', err);
    res.status(500).json({ success: false, message: 'Error al verificar las credenciales.', error: err.message });
  }
});

// ************* Ejecutar procedimiento para ingresar operación
app.post('/invokeProcedure', async (req, res) => {
  const { rut, codCobPag, mntCob, obsOrd, codMtv, fecRea } = req.body;

  try {
    const connection = await connectToOracle();
    const fecReaDate = formatDate(fecRea); // Formatea la fecha si existe
    const mntCobNumber = parseFloat(mntCob); // Convierte el monto a número

    await connection.execute(
      `BEGIN ADMIN.ccs_log_mod_liq.pcs_ing_mov(
        :p_rut,
        :p_tl_mod_cob_pag_cod_cob_pag,
        :p_mnt_cob,
        :p_obs_ord,
        :p_tl_mtv_cob_pag_cod_mtv,
        TO_DATE(:p_fec_rea, 'DD-MM-YYYY HH24:MI:SS')
      ); END;`,
      {
        p_rut: rut,
        p_tl_mod_cob_pag_cod_cob_pag: codCobPag,
        p_mnt_cob: mntCobNumber,
        p_obs_ord: obsOrd,
        p_tl_mtv_cob_pag_cod_mtv: codMtv,
        p_fec_rea: fecReaDate || null,
      }
    );

    res.json({ message: 'Procedimiento ejecutado exitosamente.' });
    await connection.close();
  } catch (err) {
    console.error('Error al ejecutar el procedimiento:', err);
    res.status(500).json({ message: 'Error al ejecutar el procedimiento.', error: err.message });
  }
});

// ************* Obtener lista de códigos de cobranza
app.get('/getCodigosCobro', async (req, res) => {
  try {
    const connection = await connectToOracle();

    const result = await connection.execute(
      `BEGIN ADMIN.ccs_log_mod_liq.pcs_lis_cob_pag_tod(:p_cur_list_cob_pag); END;`,
      {
        p_cur_list_cob_pag: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
      }
    );

    const cursor = result.outBinds.p_cur_list_cob_pag;
    const rows = await cursor.getRows(); // Obtén las filas del cursor

    await connection.close();

    // Verifica las filas que has obtenido
    //console.log("Filas obtenidas:", rows);

    if (rows.length > 0) {
      // Procesa las filas y conviértelas a objetos con claves 'codigo' y 'descripcion'
      const formattedRows = rows.map(row => {
        return {
          codigo: row[0],  // Primer elemento (código)
          descripcion: row[1],  // Segundo elemento (descripción)
        };
      });

      res.json({ message: 'Datos obtenidos exitosamente.', data: formattedRows });
    } else {
      res.json({ message: 'No se encontraron resultados en la base de datos.', data: [] });
    }
  } catch (err) {
    console.error('Error al ejecutar el procedimiento:', err);
    res.status(500).json({ message: 'Error al obtener los códigos de cobro.', error: err.message });
  }
});

// ************* Obtener lista de códigos de motivo
app.get('/getCodigosMotivo', async (req, res) => {
  try {
    const connection = await connectToOracle();

    const result = await connection.execute(
      `BEGIN ADMIN.ccs_log_mod_liq.pcs_lis_mtv(:p_cur_list_mtv); END;`,
      {
        p_cur_list_mtv: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
      }
    );

    const cursor = result.outBinds.p_cur_list_mtv;
    const rows = await cursor.getRows(); // Obtén las filas del cursor

    await connection.close();

    if (rows.length > 0) {
      // Procesa las filas y conviértelas a objetos con claves 'codigo' y 'descripcion'
      const formattedRows = rows.map(row => {
        const [codigo, descripcion] = row[0].split('  '); // Divide el string en código y descripción
        return {
          codigo: codigo.trim(),  // Código de motivo
          descripcion: descripcion.trim(),  // Descripción del motivo
        };
      });

      res.json({ message: 'Datos obtenidos exitosamente.', data: formattedRows });
    } else {
      res.json({ message: 'No se encontraron resultados en la base de datos.', data: [] });
    }
  } catch (err) {
    console.error('Error al ejecutar el procedimiento:', err);
    res.status(500).json({ message: 'Error al obtener los códigos de motivo.', error: err.message });
  }
});

// ************* Obtener lista de movimientos
app.get('/api/movimientos', async (req, res) => {
  let connection;
  try {
    connection = await connectToOracle();
    const result = await connection.execute(
      `BEGIN ADMIN.ccs_log_mod_liq.pcs_list_mov(:cursor); END;`,
      { cursor: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR } }
    );

    const cursor = result.outBinds.cursor;
    const rows = await cursor.getRows();
    await cursor.close();

    const movimientos = rows.map(row => ({
      Numero_orden: row[0],
      Responsable: row[1],
      Modalidad: row[2],
      Nombre_Tarjeta: row[3],
      Fecha_Movimiento: row[4],
      Monto: row[5],
      Observacion: row[6] || "-",
      Descripcion: row[7] || "-"
    }));

    res.json(movimientos);
  } catch (error) {
    console.error("Error en la consulta:", error);
    res.status(500).json({ error: "Error al obtener datos" });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
});

// ************* Eliminar un movimiento
app.delete('/eliminar-movimiento/:numeroOrden', async (req, res) => {
  const { numeroOrden } = req.params;

  try {
      const connection = await connectToOracle();

      await connection.execute(
          `BEGIN ADMIN.ccs_log_mod_liq.pcs_eli_mov(:p_num_ord); END;`,
          {
              p_num_ord: numeroOrden,
          }
      );

      res.json({ message: 'Movimiento eliminado exitosamente.' });
      await connection.close();
  } catch (err) {
      console.error('Error al eliminar el movimiento:', err);
      res.status(500).json({ message: 'Error al eliminar el movimiento.', error: err.message });
  }
});

// ************* Obtener saldos de tarjetas de los bancos
app.get('/api/saldos', async (req, res) => {
  let connection;
  try {
    connection = await connectToOracle();

    // Función para ejecutar un procedimiento almacenado y obtener los resultados
    const getSaldoFromProcedure = async (procedureName) => {
      const result = await connection.execute(
        `BEGIN ${procedureName}(:p_cur_list_sal); END;`,
        {
          p_cur_list_sal: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
        }
      );

      const cursor = result.outBinds.p_cur_list_sal;
      const rows = await cursor.getRows();
      await cursor.close();

      return rows;
    };

    // Obtener saldos para cada banco
    const saldos = {
      bancoChile: await getSaldoFromProcedure('ADMIN.ccs_log_mod_liq.pcs_sal_car'),
      bancoFalabella: await getSaldoFromProcedure('ADMIN.ccs_log_mod_liq.pcs_sal_car_fal'),
      liderBci: await getSaldoFromProcedure('ADMIN.ccs_log_mod_liq.pcs_sal_car_bci'),
      tenpo: await getSaldoFromProcedure('ADMIN.ccs_log_mod_liq.pcs_sal_car_ten'),
    };

    res.json(saldos);
  } catch (err) {
    console.error('Error al obtener los saldos:', err);
    res.status(500).json({ error: 'Error al obtener los saldos' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando la conexión:', err);
      }
    }
  }
});

// ************* Obtener lista de estado de cuentas
app.get('/api/estado-cuentas', async (req, res) => {
  let connection;
  try {
    connection = await connectToOracle();

    const result = await connection.execute(
      `BEGIN ADMIN.ccs_log_mod_liq.pcs_lis_est_cta(:p_cur_list_est_cta); END;`,
      {
        p_cur_list_est_cta: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT },
      }
    );

    const cursor = result.outBinds.p_cur_list_est_cta;
    const rows = await cursor.getRows();
    await cursor.close();

    const estadoCuentas = rows.map(row => ({
      EST_CTA: row[0],
      descripcion: row[1],
    }));

    res.json(estadoCuentas);
  } catch (error) {
    console.error('Error al obtener el estado de cuentas:', error);
    res.status(500).json({ error: 'Error al obtener el estado de cuentas' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error cerrando la conexión:', err);
      }
    }
  }
});

// Ruta para grabar la cartera
app.post("/api/grabar-cartera", async (req, res) => {
  let connection;
  try {
      connection = await connectToOracle();

      // Ejecutar el procedimiento almacenado
      await connection.execute(`BEGIN ADMIN.ccs_log_mod_liq.pcs_act_car; END;`);

      await connection.close();
      res.status(200).json({ message: "Cartera grabada exitosamente" });

  } catch (error) {
      console.error("Error al ejecutar el procedimiento:", error); // Mostrará el error detallado en la consola del servidor

      if (connection) {
          await connection.close();
      }

      res.status(500).json({ 
          message: "Error al grabar la cartera", 
          error: error.message  // Enviará el error exacto al frontend
      });
  }
});

// ************* Obtener montos por período (Reporte de pagos)
app.get('/reporte', async (req, res) => {
  const { mes, anio } = req.query; // Se espera ?mes=01&anio=2025

  if (!mes || !anio) {
    return res.status(400).json({ error: "Faltan parámetros mes y anio" });
  }

  let connection;
  try {
    connection = await connectToOracle();
    
    const result = await connection.execute(
      `BEGIN ADMIN.obtener_montos_por_periodo(:mes, :anio, :monto_restaurants, :monto_supermercado, :monto_bencina,
      :monto_automovil, :monto_deportes, :monto_intereses, :monto_transportes, :monto_medicina, :monto_vestuario,
      :monto_hogar, :monto_ocio, :monto_otros); END;`,
      {
        mes: mes,
        anio: anio,
        monto_restaurants: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        monto_supermercado: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        monto_bencina: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        monto_automovil: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        monto_deportes: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        monto_intereses: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        monto_transportes: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        monto_medicina: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        monto_vestuario: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        monto_hogar: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        monto_ocio: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        monto_otros: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    res.json({
      restaurants: result.outBinds.monto_restaurants,
      supermercado: result.outBinds.monto_supermercado,
      bencina: result.outBinds.monto_bencina,
      automovil: result.outBinds.monto_automovil,
      deportes: result.outBinds.monto_deportes,
      intereses: result.outBinds.monto_intereses,
      transportes: result.outBinds.monto_transportes,
      medicina: result.outBinds.monto_medicina,
      vestuario: result.outBinds.monto_vestuario,
      hogar: result.outBinds.monto_hogar,
      ocio: result.outBinds.monto_ocio,
      otros: result.outBinds.monto_otros
    });

  } catch (err) {
    console.error('Error al obtener reporte:', err);
    res.status(500).json({ error: "Error al obtener reporte.", message: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});


// Iniciar el servidor
app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));