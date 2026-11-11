export const GOALS = {
  production: "Aumentar la producción de cacao",
  soil: "Mejorar o mantener la calidad del suelo",
  health: "Prevenir y controlar enfermedades o plagas",
  diversity: "Diversificar la parcela y generar sombra con valor",
} as const;

export const TERRAIN = {
  flat: "Plana o en valle",
  slope: "Ladera o pendiente",
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
  moniliasis: { name: "Moniliasis", observation: "Manchas y polvo blanquecino sobre mazorcas." },
  witchesBroom: {
    name: "Escoba de bruja",
    observation: "Brotes agrupados o deformados, con aspecto de escoba.",
  },
  blackPod: {
    name: "Mazorca negra",
    observation: "Manchas pardas u oscuras que avanzan sobre la mazorca.",
  },
} as const;

export const PATHS = {
  current: {
    title: "Cuidar y optimizar lo que ya tienes",
    description:
      "Para mantener el cacao establecido con labores de suelo, sombra, nutrición y sanidad.",
  },
  recovery: {
    title: "Rehabilitar, renovar o transformar la parcela",
    description:
      "Para recuperar cacao con baja producción o establecerlo en un terreno intervenido.",
  },
  health: {
    title: "Protección fitosanitaria y control de enfermedades",
    description: "Para organizar recorridos y responder a señales de enfermedades o plagas.",
  },
} as const;
