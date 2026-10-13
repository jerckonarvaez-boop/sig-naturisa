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
  obtener,
  secciones,
} from './laboratorio.controller.js';

export const laboratorioRouter = Router();

laboratorioRouter.get('/secciones', secciones);
laboratorioRouter.get('/informes', listar);
laboratorioRouter.get('/informes/:id', obtener);
laboratorioRouter.post('/informes', crear);
laboratorioRouter.put('/informes/:id', actualizar);
laboratorioRouter.delete('/informes/:id', eliminar);
laboratorioRouter.get('/correo', correo);
laboratorioRouter.put('/correo/plantilla', cambiarPlantilla);
laboratorioRouter.put('/correo/destinatarios', cambiarDestinatarios);
