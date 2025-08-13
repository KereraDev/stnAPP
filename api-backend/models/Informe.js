// models/informe.js
const mongoose = require('mongoose');

// ---------- Subesquemas ----------
const ControlesSchema = new mongoose.Schema({
  numeroSerieTermoAnemHigrometro: { type: String, trim: true, default: '' }, // N° de serie Termo-Anem-Higrometro
  humedadAmbiente:                 { type: String, trim: true, default: '' },
  velocidadViento:                 { type: String, trim: true, default: '' },
  numeroSerieConductivimetro:      { type: String, trim: true, default: '' },
  conductividad:                   { type: String, trim: true, default: '' },
  presionLavado:                   { type: String, trim: true, default: '' },
}, { _id: false });

const ProgramaSchema = new mongoose.Schema({
  mes:                    { type: Date },                     // fecha
  estructurasLavadas:     { type: Number, min: 0, default: 0 },
  estructurasPendientes:  { type: Number, min: 0, default: 0 },
  porcentajeAvance:       { type: Number, min: 0, max: 100, default: 0 }, // % de avance
  cantidadEst:            { type: Number, min: 0, default: 0 },           // Cantidad Est.
  tramo:                  { type: String, trim: true, default: '' },
  numeroCadenasLavadas:   { type: Number, min: 0, default: 0 },           // N° de cadenas lavadas
}, { _id: false });

const ControlAguaSchema = new mongoose.Schema({
  fecha:          { type: Date },
  responsable:    { type: String, trim: true, default: '' },
  proveedorAgua:  { type: String, trim: true, default: '' },
  consumoDiario:  { type: String, trim: true, default: '' },  // lo pides como string
}, { _id: false });

const PersonalInvolucradoSchema = new mongoose.Schema({
  supervisor:       { type: Number, min: 0, default: 0 },
  jefeBrigada:      { type: Number, min: 0, default: 0 },
  prevencionista:   { type: Number, min: 0, default: 0 },
  operador:         { type: Number, min: 0, default: 0 },
  tecnico:          { type: Number, min: 0, default: 0 },
  ayudante:         { type: Number, min: 0, default: 0 },
}, { _id: false });

const TotalesSchema = new mongoose.Schema({
  hh:            { type: Number, min: 0, default: 0 }, // Hh
  aguaUtilizada: { type: String, trim: true, default: '' },
}, { _id: false });

// NOTA: asumo que puede haber **varios** equipos lavados → array
const EquipoLavadoSchema = new mongoose.Schema({
  numero:         { type: Number, min: 0 },                     // N°
  tipo:           { type: String, trim: true, default: '' },    // Tipo
  equipos:        { type: Number, min: 0, default: 0 },         // Equipos
  lavados:        { type: Number, min: 0, default: 0 },         // Lavados
  fecha:          { type: Date },
  numeroPT:       { type: Number, min: 0 },                     // N° PT
  jefeFaena:      { type: String, trim: true, default: '' },    // Jefe de faena (en el objeto)
  numeroSerie:    { type: Number, min: 0 },                     // N° Serie
  equipo:         { type: String, trim: true, default: '' },    // Equipo
  H:              { type: Number, min: 0 },                     // H
  C:              { type: String, trim: true, default: '' },    // C
  vV:             { type: String, trim: true, default: '' },    // V-V
  P:              { type: String, trim: true, default: '' },    // P
  camion:         { type: String, trim: true, default: '' },    // Camion
  metodo:         { type: String, trim: true, default: '' },    // Método
  lavada:         { type: Boolean, default: false },            // Lavada (sí/no)
  observaciones:  { type: String, trim: true, default: '' },    // Observaciones
}, { _id: false });

const FirmaSchema = new mongoose.Schema({
  jefeBrigada: { type: String, trim: true, default: '' },       // Firma: Jefe de brigada
}, { _id: false });

// ---------- Esquema principal ----------
const informeSchema = new mongoose.Schema({
  // Cabecera
  jefeFaena:        { type: String, trim: true, default: '' },  // Jefe de faena
  encargado:        { type: String, trim: true, default: '' },  // Encargado
  instalacion:      { type: String, trim: true, default: '' },  // Instalacion

  fechaInicio:      { type: Date, default: Date.now },          // al crear el informe
  fechaTermino:     { type: Date, default: null },              // al terminar el informe (setear al cerrar)

  tipoIntervencion: { type: String, trim: true, default: '' },  // Tipo de intervencion

  // Controles
  controles:        { type: ControlesSchema, default: {} },

  // Programa
  programa:         { type: ProgramaSchema, default: {} },

  // Control de Agua
  controlAgua:      { type: ControlAguaSchema, default: {} },

  // Personal Involucrado
  personal:         { type: PersonalInvolucradoSchema, default: {} },

  // Totales
  totales:          { type: TotalesSchema, default: {} },

  // Equipos Lavados (lista)
  equiposLavados:   { type: [EquipoLavadoSchema], default: [] },

  // Imágenes (URLs o rutas)
  imagenes:         { type: [String], default: [] },

  // Observaciones Generales
  observacionGeneral: { type: String, trim: true, default: '' },

  // Firma
  firma:            { type: FirmaSchema, default: {} },
}, {
  timestamps: true
});

// Índices útiles
informeSchema.index({ fechaInicio: -1 });
informeSchema.index({ fechaTermino: -1 });
informeSchema.index({ 'programa.mes': -1 });
informeSchema.index({ jefeFaena: 1, encargado: 1 });

// Salida limpia
informeSchema.set('toJSON', {
  transform: (_doc, ret) => { delete ret.__v; return ret; }
});

module.exports = mongoose.model('Informe', informeSchema);
