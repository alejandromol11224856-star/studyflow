import {
  BedDouble,
  Bike,
  BookOpen,
  Brain,
  Briefcase,
  Calculator,
  Camera,
  ChefHat,
  CircleCheck,
  CodeXml,
  Coffee,
  Droplets,
  Dumbbell,
  FlaskConical,
  Flower2,
  Footprints,
  Gamepad2,
  Globe,
  GraduationCap,
  Guitar,
  Heart,
  HeartPulse,
  House,
  Languages,
  Laptop,
  Leaf,
  LibraryBig,
  Lightbulb,
  type LucideIcon,
  Medal,
  Mic,
  Moon,
  Mountain,
  Music,
  Palette,
  PawPrint,
  PenLine,
  Plane,
  Sprout,
  Star,
  Sun,
  Target,
  Trophy,
  Users,
  Volleyball,
  Wallet,
  Wrench,
} from "lucide-react";

/**
 * Paleta categórica validada (separación para daltonismo, piso de visión
 * normal y contraste) en modo claro y oscuro. Los valores reales viven en
 * globals.css (--sec-*), así cada modo usa su propio paso de color.
 * El orden importa: las secciones nuevas toman el siguiente color libre.
 */
export const SECTION_COLOR_ORDER = ["blue", "orange", "aqua", "yellow", "magenta", "green", "violet", "red"] as const;

export type SectionColor = (typeof SECTION_COLOR_ORDER)[number];

export const SECTION_COLORS = Object.fromEntries(
  SECTION_COLOR_ORDER.map((c) => [c, `var(--sec-${c})`]),
) as Record<SectionColor, string>;

export const SECTION_COLOR_LABEL: Record<SectionColor, string> = {
  blue: "Azul",
  orange: "Naranja",
  aqua: "Turquesa",
  yellow: "Amarillo",
  magenta: "Rosa",
  green: "Verde",
  violet: "Violeta",
  red: "Rojo",
};

export const SECTION_ICONS = {
  "book-open": BookOpen,
  "graduation-cap": GraduationCap,
  library: LibraryBig,
  dumbbell: Dumbbell,
  languages: Languages,
  code: CodeXml,
  laptop: Laptop,
  trophy: Trophy,
  volleyball: Volleyball,
  medal: Medal,
  footprints: Footprints,
  bike: Bike,
  mountain: Mountain,
  brain: Brain,
  pen: PenLine,
  calculator: Calculator,
  flask: FlaskConical,
  globe: Globe,
  music: Music,
  guitar: Guitar,
  palette: Palette,
  camera: Camera,
  briefcase: Briefcase,
  heart: Heart,
  leaf: Leaf,
  coffee: Coffee,
  gamepad: Gamepad2,
  target: Target,
  flower: Flower2,
  "heart-pulse": HeartPulse,
  sprout: Sprout,
  moon: Moon,
  sun: Sun,
  bed: BedDouble,
  droplets: Droplets,
  chef: ChefHat,
  wallet: Wallet,
  users: Users,
  house: House,
  paw: PawPrint,
  lightbulb: Lightbulb,
  mic: Mic,
  plane: Plane,
  wrench: Wrench,
  star: Star,
  check: CircleCheck,
} satisfies Record<string, LucideIcon>;

export type SectionIcon = keyof typeof SECTION_ICONS;

export const DEFAULT_SECTION_COLOR: SectionColor = "blue";
export const DEFAULT_SECTION_ICON: SectionIcon = "book-open";
/** Color usado para actividades sin sección. */
export const UNASSIGNED_COLOR = "var(--sec-none)";

export function isSectionColor(value: unknown): value is SectionColor {
  return typeof value === "string" && value in SECTION_COLORS;
}

export function isSectionIcon(value: unknown): value is SectionIcon {
  return typeof value === "string" && value in SECTION_ICONS;
}

/** Color CSS (var(--sec-*)) de una sección; gris si no tiene. */
export function sectionColor(color: string | null | undefined) {
  return isSectionColor(color) ? SECTION_COLORS[color] : UNASSIGNED_COLOR;
}

export function sectionIconComponent(icon: string | null | undefined): LucideIcon {
  return isSectionIcon(icon) ? SECTION_ICONS[icon] : Target;
}

/** Siguiente color libre en el orden de la paleta (repite si se agotan). */
export function nextSectionColor(used: string[]): SectionColor {
  const free = SECTION_COLOR_ORDER.find((c) => !used.includes(c));
  return free ?? SECTION_COLOR_ORDER[used.length % SECTION_COLOR_ORDER.length];
}

/**
 * Sugerencias opcionales para el onboarding. No se crea nada automáticamente:
 * el usuario elige sus propias áreas y puede escribir cualquier nombre.
 */
export const SECTION_SUGGESTIONS = [
  "Estudio",
  "Trabajo",
  "Gimnasio",
  "Lectura",
  "Idiomas",
  "Meditación",
  "Programación",
  "Deporte",
  "Música",
  "Escritura",
  "Proyecto personal",
  "Finanzas",
];

export const HABIT_SUGGESTIONS = [
  "Leer",
  "Meditar",
  "Entrenar",
  "Tomar 2 L de agua",
  "Dormir 8 horas",
  "Practicar idiomas",
  "Escribir un diario",
  "Caminar",
];

const ICON_RULES: [RegExp, SectionIcon][] = [
  [/estud|facu|univers|examen|parcial|final|curso|clase|colegio/, "graduation-cap"],
  [/lect|leer|libro/, "library"],
  [/gim|gym|entren|pesas|muscul|fuerza|crossfit/, "dumbbell"],
  [/ingl|idiom|franc|alem|portug|ital|japon|chino|lengua/, "languages"],
  [/program|codig|code|desarroll|software|web/, "code"],
  [/medit|mindful|respir|yoga/, "flower"],
  [/trabaj|oficina|laburo|cliente|negocio|empresa/, "briefcase"],
  [/futbol|fútbol|tenis|basquet|básquet|padel|pádel|deporte|partido/, "trophy"],
  [/corr|running|camin|trote|paso/, "footprints"],
  [/bici|ciclis/, "bike"],
  [/music|guitar|piano|cant|bater/, "music"],
  [/escrib|diario|blog|redac/, "pen"],
  [/finanz|ahorro|plata|dinero|invers|presupuest/, "wallet"],
  [/dorm|sueño|sueno|descans/, "bed"],
  [/agua|hidrat/, "droplets"],
  [/cocin|comida|recet|nutri|dieta/, "chef"],
  [/salud|cardio|corazon|corazón/, "heart-pulse"],
  [/dibuj|arte|pint|diseñ|disen/, "palette"],
  [/foto/, "camera"],
  [/matem|calcul|álgebra|algebra/, "calculator"],
  [/cienc|quim|quím|fisic|físic|biolog|laborat/, "flask"],
  [/proyect|idea|emprend/, "lightbulb"],
  [/famil|amig|social/, "users"],
  [/casa|hogar|limpi|orden/, "house"],
  [/mascot|perro|gato/, "paw"],
  [/podcast|radio|hablar|oratoria/, "mic"],
  [/viaj/, "plane"],
  [/jueg|gaming|videojuego/, "gamepad"],
  [/montañ|montan|trekking|escal/, "mountain"],
];

/** Sugiere un ícono a partir del nombre ("Meditación" -> flor). */
export function guessSectionIcon(name: string): SectionIcon {
  const n = name.toLowerCase();
  for (const [re, icon] of ICON_RULES) if (re.test(n)) return icon;
  return "target";
}
