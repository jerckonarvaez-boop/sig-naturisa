import { useEffect, useState, type RefObject } from 'react';
import { crearEml, descargar } from '@/services/documentos/correo';
import { elementoAPdf, type Orientacion } from '@/services/documentos/pdf';
import { nombreArchivo, rellenar } from '../logic/correo';
import { guardarDestinatarios, guardarPlantillaCorreo, obtenerCorreo, type PlantillaCorreo } from '../services/laboratorio.api';
import type { SeccionLab } from '../types';

interface Opciones {
  seccion: SeccionLab;
  codigo: string;
  sucursal: string;
  fechaEmision: string;
  /** Informe con el diseño oficial, que se convierte en PDF */
  reporte: RefObject<HTMLDivElement | null>;
  orientacion: Orientacion;
}

export type EstadoEnvio = { texto: string; error?: boolean } | null;

/** Correo de un informe: destinatarios, texto (desde la plantilla), PDF y borrador de Outlook (.eml). */
export function useEnvioCorreo({ seccion, codigo, sucursal, fechaEmision, reporte, orientacion }: Opciones) {
  const [cargado, setCargado] = useState(false);
  const [para, setPara] = useState('');
  const [cc, setCc] = useState('');
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [plantilla, setPlantilla] = useState<PlantillaCorreo>({ asunto: '', mensaje: '' });
  const [ocupado, setOcupado] = useState(false);
  const [estado, setEstado] = useState<EstadoEnvio>(null);
  const datos = { codigo, sucursal, fechaEmision };

  useEffect(() => {
    let vigente = true;
    obtenerCorreo(sucursal)
      .then((c) => {
        if (!vigente) return;
        const texto = rellenar(c.plantilla, seccion, { codigo, sucursal, fechaEmision });
        setPlantilla(c.plantilla);
        setPara(c.para);
        setCc(c.cc);
        setAsunto(texto.asunto);
        setMensaje(texto.mensaje);
        setCargado(true);
      })
      .catch((e: Error) => vigente && setEstado({ texto: e.message, error: true }));
    return () => {
      vigente = false;
    };
  }, [seccion, codigo, sucursal, fechaEmision]);

  async function generarPdf() {
    if (!reporte.current) throw new Error('El informe aún no está listo.');
    return elementoAPdf(reporte.current, orientacion);
  }

  /** Devuelve true si la acción terminó bien */
  async function ejecutar(accion: () => Promise<string>): Promise<boolean> {
    setOcupado(true);
    setEstado(null);
    try {
      setEstado({ texto: await accion() });
      return true;
    } catch (e) {
      setEstado({ texto: (e as Error).message, error: true });
      return false;
    } finally {
      setOcupado(false);
    }
  }

  /** Crea el borrador de Outlook (.eml con el PDF adjunto) y recuerda los destinatarios */
  const crearBorrador = () =>
    ejecutar(async () => {
      if (!para.trim()) throw new Error('Indique al menos un destinatario.');
      const destinatarios = await guardarDestinatarios(sucursal, para, cc); // también valida los correos
      setPara(destinatarios.para);
      setCc(destinatarios.cc);
      const nombre = nombreArchivo(datos);
      const pdf = await generarPdf();
      const eml = crearEml({
        para: destinatarios.para,
        cc: destinatarios.cc,
        asunto,
        mensaje,
        adjuntos: [{ nombre: `${nombre}.pdf`, tipo: 'application/pdf', datos: pdf }],
      });
      descargar(eml, `${nombre}.eml`);
      return 'Listo: abra el archivo descargado (.eml) y Outlook mostrará el correo con el PDF adjunto para revisar y enviar.';
    });

  const descargarPdf = () =>
    ejecutar(async () => {
      descargar(new Blob([await generarPdf()], { type: 'application/pdf' }), `${nombreArchivo(datos)}.pdf`);
      return 'PDF descargado.';
    });

  /** Guarda el texto predeterminado (con marcadores) y lo aplica a este correo */
  const guardarPlantilla = (nueva: PlantillaCorreo) =>
    ejecutar(async () => {
      const guardada = await guardarPlantillaCorreo(nueva);
      setPlantilla(guardada);
      const texto = rellenar(guardada, seccion, datos);
      setAsunto(texto.asunto);
      setMensaje(texto.mensaje);
      return 'Texto predeterminado guardado.';
    });

  return {
    cargado,
    para,
    setPara,
    cc,
    setCc,
    asunto,
    setAsunto,
    mensaje,
    setMensaje,
    plantilla,
    ocupado,
    estado,
    crearBorrador,
    descargarPdf,
    guardarPlantilla,
  };
}
