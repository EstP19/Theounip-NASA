export const GOALS = {
  production: "Aumentar la producción de cacao",
  soil: "Mejorar o mantener la calidad del suelo",
  health: "Prevenir y controlar enfermedades o plagas",
  diversity: "Diversificar la parcela y generar sombra con valor",
} as const;

export const TERRAIN = {
  flat: "Plano / Valle (Drenaje normal)",
  slope: "Ladera / Pendiente (Escorrentía rápida / riesgo de erosión)",
  nearWater: "Cerca a río o cuenca (Susceptible a encharcamiento / inundación)",
  unknown: "Por conocer",
} as const;
export const SYSTEMS = {
  agroforestry: "Sistema agroforestal (SAF)",
  monoculture: "Monocultivo",
  chagra: "Huerto casero o chagra",
  unknown: "Por conocer",
} as const;
export const MATERIALS = {
  seed: "Cacao de semilla",
  graft: "Cacao clonado o injertado",
  mixed: "Mezcla de variedades o clones",
  unknown: "No lo sé",
} as const;

export const DISEASES = {
  moniliasis: {
    name: "Moniliasis",
    observation: "Manchas y polvo blanquecino sobre el fruto de cacao.",
  },
  witchesBroom: {
    name: "Escoba de bruja",
    observation: "Brotes agrupados o deformados, con aspecto de escoba.",
  },
  blackPod: {
    name: "Mazorca negra",
    observation: "Manchas pardas u oscuras que avanzan sobre el fruto de cacao.",
  },
} as const;

export const FRUITING_ANSWERS = {
  unknown: "No lo sé todavía",
  yes: "Sí, ya tiene frutos",
  no: "Todavía no tiene frutos",
} as const;

export const FRUIT_DAMAGE_ANSWERS = {
  unknown: "No los he revisado",
  no: "No he observado daños",
  yes: "Sí, he visto algunos",
} as const;

export const PATHS = {
  current: {
    title: "Cuidar y optimizar lo que ya tienes",
  },
  recovery: {
    title: "Rehabilitar, renovar o transformar la parcela",
  },
  health: {
    title: "Protección fitosanitaria y control de enfermedades",
  },
} as const;
