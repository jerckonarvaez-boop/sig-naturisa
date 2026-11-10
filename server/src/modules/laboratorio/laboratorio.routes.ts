// Laboratorio de análisis (agua, suelo, patologías en fresco): /api/laboratorio
import { Router } from 'express';
import {
  actualizar,
  cambiarDestinatarios,
  cambiarPlantilla,
  correo,
  crear,
  eliminar,
  listar,
  guardarQuimicos,
  obtener,
  parametrosQuimicos,
  restaurarQuimicos,
  resultados,
  secciones,
} from './laboratorio.controller.js';

export const laboratorioRouter = Router();

laboratorioRouter.get('/secciones', secciones);
laboratorioRouter.get('/parametros-quimicos', parametrosQuimicos);
laboratorioRouter.put('/parametros-quimicos', guardarQuimicos);
laboratorioRouter.delete('/parametros-quimicos', restaurarQuimicos);
laboratorioRouter.get('/informes', listar);
laboratorioRouter.get('/resultados', resultados);
laboratorioRouter.get('/informes/:id', obtener);
laboratorioRouter.post('/informes', crear);
laboratorioRouter.put('/informes/:id', actualizar);
laboratorioRouter.delete('/informes/:id', eliminar);
laboratorioRouter.get('/correo', correo);
laboratorioRouter.put('/correo/plantilla', cambiarPlantilla);
laboratorioRouter.put('/correo/destinatarios', cambiarDestinatarios);
