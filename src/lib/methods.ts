/**
 * Métodos de estudio y de hábitos: contenido educativo integrado a
 * StudyFlow. Cada método termina en una acción concreta (empezar una sesión
 * con ese método o crear un hábito con él), no es solo un artículo.
 */
export type MethodKind = "study" | "habit";

export interface Method {
  slug: string;
  kind: MethodKind;
  name: string;
  /** Una línea: qué te da. */
  tagline: string;
  what: string;
  how: string[];
  when: string[];
  example: { context: string; text: string };
  /** Duración recomendada (si corresponde). */
  duration?: string;
  /** Origen o referencia, dicho con prudencia. */
  origin?: string;
  /** Acción: sesión con un plan del temporizador… */
  session?: { methodId: "pomodoro" | "block-50" | "deep-work"; title: string; label: string };
  /** …o un hábito sugerido para crear. */
  habit?: { name: string };
}

export const METHODS: Method[] = [
  // ---------------------------------------------------------------------
  // Estudio
  // ---------------------------------------------------------------------
  {
    slug: "pomodoro",
    kind: "study",
    name: "Pomodoro",
    tagline: "Bloques cortos de foco con descansos.",
    what: "Trabajás 25 minutos con foco total en una sola tarea y descansás 5. Cada cuatro bloques hacés un descanso más largo, de 15 a 30 minutos.",
    how: [
      "Elegí una tarea concreta.",
      "Empezá un bloque de 25 minutos y trabajá sin interrupciones.",
      "Si aparece una distracción, anotala y seguí.",
      "Al terminar el bloque, descansá 5 minutos lejos de la pantalla.",
      "Cada cuatro bloques, tomate un descanso largo.",
    ],
    when: ["Cuando te cuesta arrancar o venís postergando.", "Tareas que se pueden partir en pasos.", "Días con poca energía o con muchas interrupciones."],
    example: {
      context: "Tenés que estudiar un capítulo de Física.",
      text: "Dos bloques para leer y subrayar, uno para resolver ejercicios y uno para repasar lo que más te costó.",
    },
    duration: "25 min de foco + 5 de descanso",
    origin: "Técnica creada por Francesco Cirillo a fines de los años 80.",
    session: { methodId: "pomodoro", title: "Pomodoro", label: "Comenzar Pomodoro" },
  },
  {
    slug: "deep-work",
    kind: "study",
    name: "Deep Work",
    tagline: "Sesiones largas de concentración profunda.",
    what: "Bloques largos, de 60 a 90 minutos, dedicados a una sola tarea exigente: sin notificaciones, sin chats y sin cambiar de contexto.",
    how: [
      "Definí antes de empezar qué querés lograr en la sesión.",
      "Silenciá el celular y cerrá pestañas y chats.",
      "Trabajá 90 minutos en una sola cosa.",
      "Cerrá con una nota de dónde quedaste, para retomar fácil.",
    ],
    when: ["Programar, escribir o resolver problemas difíciles.", "Cuando necesitás entrar en flujo.", "En la franja del día en la que tenés más energía."],
    example: {
      context: "Estás aprendiendo programación.",
      text: "90 minutos para implementar una funcionalidad completa, con el chat cerrado y el celular en otra habitación.",
    },
    duration: "90 min + 15 de descanso",
    origin: "Concepto popularizado por Cal Newport en el libro «Deep Work» (2016).",
    session: { methodId: "deep-work", title: "Deep Work", label: "Comenzar Deep Work" },
  },
  {
    slug: "time-blocking",
    kind: "study",
    name: "Time Blocking",
    tagline: "Cada tarea tiene su lugar en el día.",
    what: "En lugar de una lista de pendientes, le asignás a cada tarea un bloque concreto del día, con hora de inicio y de fin. Lo que tiene horario, se hace.",
    how: [
      "Al empezar el día, o la noche anterior, anotá lo importante.",
      "Asignale a cada cosa un bloque con horario.",
      "Dejá bloques libres para imprevistos.",
      "Al cerrar el día, revisá y ajustá el de mañana.",
    ],
    when: ["Días con muchas responsabilidades.", "Cuando lo urgente se come lo importante.", "Para combinar estudio, trabajo y entrenamiento."],
    example: {
      context: "Un día cualquiera.",
      text: "8:00 a 9:30 Inglés · 10:00 a 12:00 Proyecto · 18:00 a 19:00 Gimnasio · 21:00 a 21:30 Lectura.",
    },
    duration: "Bloques de 50 min + 10 de descanso",
    session: { methodId: "block-50", title: "Bloque de trabajo", label: "Empezar un bloque de 50 min" },
  },
  {
    slug: "active-recall",
    kind: "study",
    name: "Active Recall",
    tagline: "Recordar en vez de releer.",
    what: "Estudiás intentando traer la información de memoria, respondiendo preguntas o explicando sin mirar, en lugar de releer. El esfuerzo de recordar es lo que fija lo aprendido.",
    how: [
      "Leé una sección una sola vez.",
      "Cerrá el material y escribí todo lo que recuerdes.",
      "Convertí los títulos en preguntas y respondelas sin mirar.",
      "Compará con la fuente y marcá lo que faltó.",
    ],
    when: ["Preparar exámenes.", "Cuando sentís que lo sabés pero no podés explicarlo.", "Repasos cortos y frecuentes."],
    example: {
      context: "Leíste sobre la fotosíntesis.",
      text: "Cerrás el libro y respondés: ¿qué entra, qué sale y dónde ocurre? Después revisás qué te faltó.",
    },
    duration: "Sesiones de 25 min",
    session: { methodId: "pomodoro", title: "Active Recall", label: "Empezar una sesión de repaso" },
  },
  {
    slug: "spaced-repetition",
    kind: "study",
    name: "Spaced Repetition",
    tagline: "Repasar justo antes de olvidar.",
    what: "Repasás lo aprendido a intervalos cada vez más largos: al día siguiente, a los tres días, a la semana, a las dos semanas y al mes. Cada repaso hace que el recuerdo dure más.",
    how: [
      "Aprendé el tema hoy.",
      "Repasalo mañana, en tres días y en siete días.",
      "Si lo recordás bien, alargá el intervalo; si no, acortalo.",
      "Usá tarjetas para no perder la cuenta.",
    ],
    when: ["Vocabulario de idiomas.", "Fórmulas, fechas y definiciones.", "Materias con mucho contenido para memorizar."],
    example: {
      context: "Estás aprendiendo inglés.",
      text: "Aprendés 20 palabras el lunes y las repasás el martes, el jueves y el lunes siguiente.",
    },
    duration: "15 a 25 min por repaso",
    origin: "Se apoya en la curva del olvido que describió Hermann Ebbinghaus.",
    session: { methodId: "pomodoro", title: "Repaso espaciado", label: "Empezar un repaso" },
  },
  {
    slug: "feynman",
    kind: "study",
    name: "Técnica Feynman",
    tagline: "Si lo podés explicar simple, lo entendiste.",
    what: "Para comprobar si entendés un tema, lo explicás con palabras simples, como si se lo contaras a alguien que no sabe nada. Donde te trabás está lo que todavía no entendés.",
    how: [
      "Escribí el tema arriba de una hoja.",
      "Explicalo con palabras simples, sin jerga.",
      "Marcá dónde te trabaste o usaste palabras difíciles.",
      "Volvé a la fuente, completá y simplificá otra vez.",
    ],
    when: ["Temas conceptuales: física, economía, programación.", "Antes de un oral o una presentación.", "Para encontrar lagunas rápido."],
    example: {
      context: "Estás aprendiendo a programar.",
      text: "Explicás qué es una variable como si fuera para alguien de 12 años: «una caja con nombre donde guardás un dato».",
    },
    duration: "Sesiones de 25 min",
    origin: "Lleva el nombre del físico Richard Feynman, conocido por explicar ideas complejas de forma simple.",
    session: { methodId: "pomodoro", title: "Técnica Feynman", label: "Empezar una sesión" },
  },
  {
    slug: "interleaving",
    kind: "study",
    name: "Interleaving",
    tagline: "Mezclar temas para aprender mejor.",
    what: "En vez de practicar un solo tipo de ejercicio por vez, alternás temas o tipos de problemas en la misma sesión. Cuesta más al principio, pero te entrena para elegir qué método usar en cada caso.",
    how: [
      "Elegí dos o tres temas relacionados.",
      "Alterná ejercicios de cada uno en lugar de hacerlos en bloque.",
      "Antes de resolver, preguntate qué tipo de problema es.",
      "Revisá los errores al final de la sesión.",
    ],
    when: ["Matemática y ejercicios prácticos.", "Deportes y música, alternando técnicas.", "Cuando ya entendés lo básico de cada tema."],
    example: {
      context: "Preparás Análisis Matemático.",
      text: "En lugar de 20 ejercicios de derivadas y después 20 de integrales, hacés uno de cada uno, alternando.",
    },
    duration: "Bloques de 50 min",
    session: { methodId: "block-50", title: "Práctica mezclada", label: "Empezar un bloque de 50 min" },
  },
  {
    slug: "leitner",
    kind: "study",
    name: "Sistema Leitner",
    tagline: "Tarjetas en cajas según cuánto te cuestan.",
    what: "Un sistema de tarjetas en cajas. Las que acertás pasan a la caja siguiente y se repasan con menos frecuencia; las que fallás vuelven a la primera. Así dedicás más tiempo a lo que más te cuesta.",
    how: [
      "Armá tarjetas con la pregunta de un lado y la respuesta del otro.",
      "Empezá con todas en la caja 1, que se repasa todos los días.",
      "Si acertás, pasá la tarjeta a la caja siguiente (cada 2 días, cada 4…).",
      "Si fallás, vuelve a la caja 1.",
    ],
    when: ["Vocabulario, definiciones y fechas.", "Cuando tenés muchas tarjetas y poco tiempo.", "Para enfocarte en lo que más te cuesta."],
    example: {
      context: "Estás aprendiendo inglés.",
      text: "Caja 1 todos los días, caja 2 cada dos días, caja 3 cada cuatro. Las palabras difíciles se quedan en la caja 1 hasta que las sabés.",
    },
    duration: "15 a 25 min por día",
    origin: "Lo propuso el divulgador alemán Sebastian Leitner en los años 70.",
    session: { methodId: "pomodoro", title: "Tarjetas Leitner", label: "Empezar a repasar" },
  },

  // ---------------------------------------------------------------------
  // Hábitos
  // ---------------------------------------------------------------------
  {
    slug: "habit-stacking",
    kind: "habit",
    name: "Habit Stacking",
    tagline: "Engancharlo a algo que ya hacés.",
    what: "Sumás un hábito nuevo justo después de uno que ya hacés todos los días. El hábito que ya tenés funciona como recordatorio natural del nuevo.",
    how: [
      "Elegí algo que ya hagas todos los días: cepillarte los dientes, preparar el café.",
      "Usá la fórmula: «Después de [lo que ya hago], voy a [hábito nuevo]».",
      "Que el hábito nuevo sea chico y concreto.",
      "Marcalo en StudyFlow cada vez que lo hagas.",
    ],
    when: ["Cuando te olvidás de hacer el hábito.", "Para armar una rutina de mañana o de noche.", "Hábitos chicos de pocos minutos."],
    example: { context: "Querés empezar a leer.", text: "Después de lavarte los dientes a la noche, leés 2 páginas." },
    origin: "Idea difundida por BJ Fogg y por James Clear.",
    habit: { name: "Leer 2 páginas después de lavarme los dientes" },
  },
  {
    slug: "two-minute-rule",
    kind: "habit",
    name: "Regla de los 2 minutos",
    tagline: "Que empezar tome menos de dos minutos.",
    what: "Reducís el hábito a una versión que se pueda hacer en menos de dos minutos. Al principio la meta no es el resultado, sino aparecer todos los días.",
    how: [
      "Pensá el hábito que querés, por ejemplo «leer más».",
      "Encontrá su versión de dos minutos: «leer una página».",
      "Hacela todos los días, aunque sea solo eso.",
      "Cuando ya sea automático, agrandalo de a poco.",
    ],
    when: ["Hábitos que nunca arrancan.", "Cuando la meta te parece enorme.", "Después de varios intentos fallidos."],
    example: { context: "Querés ir al gimnasio.", text: "Al principio, el hábito es «ponerme la ropa de entrenar». El resto viene solo." },
    origin: "Popularizada por James Clear en «Hábitos atómicos».",
    habit: { name: "Ponerme la ropa de entrenar" },
  },
  {
    slug: "implementation-intentions",
    kind: "habit",
    name: "Intenciones de implementación",
    tagline: "Decidir cuándo, dónde y qué.",
    what: "Convertís una intención vaga en un plan concreto: cuándo, dónde y qué vas a hacer. Decidirlo de antemano hace mucho más probable que lo hagas.",
    how: [
      "Usá la fórmula: «Cuando sea [hora o situación], en [lugar], voy a [acción]».",
      "Sé específico con la hora, el lugar y la acción.",
      "Agregale un recordatorio a esa hora al crear el hábito.",
      "Definí un plan B: «si llueve, entreno en casa».",
    ],
    when: ["Cuando decís «mañana empiezo» y no pasa.", "Hábitos que dependen de un horario.", "Semanas con agenda cambiante."],
    example: {
      context: "Querés practicar inglés.",
      text: "«Los lunes, miércoles y viernes a las 7:30, en el living, hago 20 minutos de inglés.»",
    },
    origin: "Concepto estudiado por el psicólogo Peter Gollwitzer.",
    habit: { name: "20 minutos de inglés a las 7:30" },
  },
  {
    slug: "environment-design",
    kind: "habit",
    name: "Diseño del entorno",
    tagline: "Que lo bueno sea lo más fácil.",
    what: "Cambiás tu entorno para que el buen hábito sea visible y fácil, y el que querés evitar tenga más fricción. Así dependés menos de la fuerza de voluntad.",
    how: [
      "Dejá a la vista lo que necesitás: el libro sobre la almohada, la ropa de entrenar lista.",
      "Alejá las distracciones: el celular en otra habitación mientras estudiás.",
      "Prepará el lugar la noche anterior.",
      "Reducí los pasos que hay entre vos y empezar.",
    ],
    when: ["Cuando te distraés con facilidad.", "Hábitos que requieren preparación.", "Para dejar de hacer algo, no solo para empezar."],
    example: {
      context: "Te cuesta sentarte a estudiar.",
      text: "Dejás el cuaderno abierto en el escritorio y el celular cargando en la cocina. Al sentarte, empezar es lo más fácil.",
    },
    habit: { name: "Preparar el escritorio la noche anterior" },
  },
  {
    slug: "minimum-viable-habit",
    kind: "habit",
    name: "Hábito mínimo",
    tagline: "La versión chica para los días difíciles.",
    what: "Definís la versión más chica aceptable de tu hábito para los días complicados. Así la constancia no se corta aunque el día no acompañe.",
    how: [
      "Definí tu versión normal: 30 minutos de inglés.",
      "Definí la mínima: 5 minutos o una sola lección.",
      "En los días difíciles, hacé la mínima sin culpa.",
      "Lo importante es no cortar la constancia.",
    ],
    when: ["Semanas con mucha carga.", "Cuando el «todo o nada» te hace abandonar.", "Después de una enfermedad o un viaje."],
    example: { context: "Salís a correr.", text: "Normal: correr 5 km. Mínima: caminar 10 minutos. Las dos cuentan." },
    origin: "Relacionado con la idea de «mini hábitos» de Stephen Guise.",
    habit: { name: "Caminar 10 minutos" },
  },
  {
    slug: "dont-break-the-chain",
    kind: "habit",
    name: "No cortes la cadena",
    tagline: "Una cadena de días que da pena cortar.",
    what: "Marcás cada día que cumplís y la cadena de días seguidos se vuelve una motivación en sí misma. Cuanto más larga, más ganas de no cortarla.",
    how: [
      "Elegí un hábito diario y chico.",
      "Marcalo en StudyFlow cada día que lo hagas.",
      "Mirá crecer tu constancia en el historial del hábito.",
      "Si un día fallás, retomá al siguiente: que nunca sean dos seguidos.",
    ],
    when: ["Hábitos diarios.", "Cuando te motiva ver el progreso.", "Para sostener algo durante meses."],
    example: { context: "Querés escribir.", text: "Escribís 10 minutos por día. A las dos semanas, la cadena de días marcados ya te empuja sola." },
    origin: "Se suele atribuir al comediante Jerry Seinfeld, que escribía chistes todos los días.",
    habit: { name: "Escribir 10 minutos" },
  },
];

export function methodBySlug(slug: string) {
  return METHODS.find((m) => m.slug === slug);
}
