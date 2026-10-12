// Laboratorio de análisis (agua, suelo, patologías en fresco): /api/laboratorio
import { Router } from 'express';
import { actualizar, crear, eliminar, listar, obtener, secciones } from './laboratorio.controller.js';

export const laboratorioRouter = Router();

laboratorioRouter.get('/secciones', secciones);
laboratorioRouter.get('/informes', listar);
laboratorioRouter.get('/informes/:id', obtener);
laboratorioRouter.post('/informes', crear);
laboratorioRouter.put('/informes/:id', actualizar);
laboratorioRouter.delete('/informes/:id', eliminar);
