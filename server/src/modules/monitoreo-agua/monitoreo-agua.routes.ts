// Monitoreo de agua (camaroneras, resultados de laboratorio y su PDF): /api/monitoreo-agua
import { Router } from 'express';
import {
  actualizarUnResultado,
  actualizarUnSitio,
  crearUnResultado,
  crearUnSitio,
  definicion,
  eliminarUnResultado,
  eliminarUnSitio,
  pdf,
  quitarPdf,
  resultado,
  resultados,
  sitios,
  subirPdf,
} from './monitoreo-agua.controller.js';

export const monitoreoAguaRouter = Router();

monitoreoAguaRouter.get('/definicion', definicion);

monitoreoAguaRouter.get('/sitios', sitios);
monitoreoAguaRouter.post('/sitios', crearUnSitio);
monitoreoAguaRouter.put('/sitios/:id', actualizarUnSitio);
monitoreoAguaRouter.delete('/sitios/:id', eliminarUnSitio);

monitoreoAguaRouter.get('/resultados', resultados);
monitoreoAguaRouter.get('/resultados/:id', resultado);
monitoreoAguaRouter.post('/resultados', crearUnResultado);
monitoreoAguaRouter.put('/resultados/:id', actualizarUnResultado);
monitoreoAguaRouter.delete('/resultados/:id', eliminarUnResultado);

monitoreoAguaRouter.get('/resultados/:id/pdf', pdf);
monitoreoAguaRouter.put('/resultados/:id/pdf', subirPdf);
monitoreoAguaRouter.delete('/resultados/:id/pdf', quitarPdf);
