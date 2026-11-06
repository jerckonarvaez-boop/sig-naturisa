// Monitoreo de agua (camaroneras, resultados de laboratorio y su PDF): /api/monitoreo-agua
import { Router } from 'express';
import {
  actualizarUnResultado,
  actualizarUnSitio,
  crearUnResultado,
  crearUnSitio,
  definicion,
  editarInforme,
  eliminarUnResultado,
  eliminarUnSitio,
  eliminarUnLogo,
  logo,
  logos,
  pdf,
  quitarPdf,
  resultado,
  resultados,
  sitios,
  subirLogo,
  subirPdf,
} from './monitoreo-agua.controller.js';

export const monitoreoAguaRouter = Router();

monitoreoAguaRouter.get('/definicion', definicion);

monitoreoAguaRouter.get('/sitios', sitios);
monitoreoAguaRouter.post('/sitios', crearUnSitio);
monitoreoAguaRouter.put('/sitios/:id', actualizarUnSitio);
monitoreoAguaRouter.delete('/sitios/:id', eliminarUnSitio);

monitoreoAguaRouter.get('/logos', logos);
monitoreoAguaRouter.get('/logos/:id', logo);
monitoreoAguaRouter.post('/logos', subirLogo);
monitoreoAguaRouter.delete('/logos/:id', eliminarUnLogo);

monitoreoAguaRouter.get('/resultados', resultados);
monitoreoAguaRouter.get('/resultados/:id', resultado);
monitoreoAguaRouter.post('/resultados', crearUnResultado);
monitoreoAguaRouter.put('/resultados/:id', actualizarUnResultado);
monitoreoAguaRouter.delete('/resultados/:id', eliminarUnResultado);

monitoreoAguaRouter.put('/resultados/:id/informes/:sitioId', editarInforme);

monitoreoAguaRouter.get('/resultados/:id/pdf', pdf);
monitoreoAguaRouter.put('/resultados/:id/pdf', subirPdf);
monitoreoAguaRouter.delete('/resultados/:id/pdf', quitarPdf);
