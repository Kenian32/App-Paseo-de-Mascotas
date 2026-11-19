require('dotenv').config();
process.env.TZ = process.env.TZ || 'America/Guayaquil';
const path = require('path');
const express = require('express');
const mw = require('./api/middleware');
const rutasSesion = require('./api/rutasSesion');
const rutasRegistro = require('./api/rutasRegistro');
const rutasMisMascotas = require('./api/rutasMisMascotas');
const rutasSolicitudes = require('./api/rutasSolicitudes');
const rutasFotos = require('./api/rutasFotos');
const rutasUsuarios = require('./api/rutasUsuarios');
const rutasDuenos = require('./api/rutasDuenos');
const rutasMascotas = require('./api/rutasMascotas');
const rutasPaseadores = require('./api/rutasPaseadores');
const { rutasPaseos, rutasPlanes, rutasMisPaseos } = require('./api/rutasPaseos');
const { rutasCobros, rutasConfiguracion } = require('./api/rutasCobros');

function crearApp(s) {
  const { conexionBD, sesionServicio, secreto = 'solo-para-pruebas', produccion = false } = s;
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/salud', async (req, res) => {
    try {
      await conexionBD.probar();
      res.json({ estado: 'ok', base_de_datos: 'conectada' });
    } catch (e) {
      console.error('MySQL no responde:', e.message);
      res.status(500).json({ estado: 'error', mensaje: 'No hay conexión con la base de datos. Revisa que MySQL esté encendido y los datos de .env.' });
    }
  });

  app.use('/api', mw.sesion({ secreto, produccion }));
  app.use('/api/sesion', rutasSesion({ sesionServicio, secreto, produccion }));
  if (s.configuracionServicio) {
    app.get('/api/publico/tarifas', async (req, res, next) => { try { res.json(await s.configuracionServicio.obtener()); } catch (e) { next(e); } });
  }
  if (s.registroServicio) app.use('/api/registro', rutasRegistro({ registroServicio: s.registroServicio, secreto, produccion }));

  app.use('/api', mw.requiereSesion());
  if (s.usuarioServicio) app.use('/api/usuarios', rutasUsuarios(s));
  if (s.duenoServicio) app.use('/api/duenos', rutasDuenos(s));
  if (s.mascotaServicio) app.use('/api/mascotas', rutasMascotas(s));
  if (s.mascotaServicio) app.use('/api/mis-mascotas', rutasMisMascotas(s));
  if (s.fotoServicio) app.use('/api/fotos', rutasFotos(s));
  if (s.solicitudServicio) app.use('/api/solicitudes', rutasSolicitudes(s));
  if (s.paseadorServicio) app.use('/api/paseadores', rutasPaseadores(s));
  if (s.paseoServicio) { app.use('/api/paseos', rutasPaseos(s)); app.use('/api/mis-paseos', rutasMisPaseos(s)); }
  if (s.planServicio) app.use('/api/planes', rutasPlanes(s));
  if (s.cobroServicio) app.use('/api/cobros', rutasCobros({ cobroServicio: s.cobroServicio, csv: s.csv }));
  if (s.configuracionServicio) app.use('/api/configuracion', rutasConfiguracion(s));

  app.use('/api', mw.rutaNoExiste);
  app.use(mw.manejadorErrores);
  return app;
}

module.exports = crearApp;

if (require.main === module) {
  const secreto = process.env.SESSION_SECRET;
  if (!secreto || secreto === 'cambia-este-secreto') {
    console.error('Define SESSION_SECRET en .env con un texto largo y aleatorio.');
    process.exit(1);
  }
  const Planificador = require('./infraestructura/Planificador');
  const servicios = require('./infraestructura/composicion')();
  const produccion = process.env.NODE_ENV === 'production';
  const csv = { separador: process.env.CSV_SEPARADOR || ';', decimal: process.env.CSV_DECIMAL || ',' };
  const puerto = Number(process.env.PORT || 3000);
  crearApp({ ...servicios, secreto, produccion, csv }).listen(puerto, () => {
    console.log(`Paseo de mascotas en http://localhost:${puerto} (zona horaria ${process.env.TZ})`);
    new Planificador(servicios.notificacionServicio).iniciar();
  });
}
