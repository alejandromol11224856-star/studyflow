import { describe, expect, it } from "vitest";
import { blockState, presetFor } from "../session-plans";
import { progressVerdict } from "./insights";
import { longestRunInRange } from "./streaks";
import { type MotivationContext, humanDuration, motivationalMessage, rewardMessage } from "./motivation";

const base: MotivationContext = {
  dateKey: "2026-10-02",
  hour: 15,
  hasGoal: true,
  ratio: 0,
  completed: false,
  remainingSeconds: 3 * 3600,
  hasActivityToday: false,
  streak: 0,
  todayCompleted: false,
  habitsDue: 0,
  habitsDone: 0,
};

describe("¿Estoy mejorando? (V4)", () => {
  it("compara con el mismo tramo del período anterior", () => {
    expect(progressVerdict({ period: "week", current: 7200, previous: 3600, daysLeft: 3 })).toMatchObject({ tone: "up", trend: 1 });
    expect(progressVerdict({ period: "week", current: 3700, previous: 3600, daysLeft: 3 }).tone).toBe("same");
    expect(progressVerdict({ period: "month", current: 0, previous: 0, daysLeft: 10 }).tone).toBe("empty");
    expect(progressVerdict({ period: "week", current: 1800, previous: 0, daysLeft: 4 }).tone).toBe("first");
  });

  it("si vas más lento lo dice con calma y con los días que quedan", () => {
    const v = progressVerdict({ period: "week", current: 1800, previous: 7200, daysLeft: 2 });
    expect(v.tone).toBe("down");
    expect(v.detail).toMatch(/Quedan 2 días/);
    expect(`${v.headline} ${v.detail}`).not.toMatch(/fallaste|mal|culpa|deberías/i);
  });
});

describe("mensajes por contexto (V4)", () => {
  it("menciona los minutos que ya llevás", () => {
    expect(motivationalMessage({ ...base, hasActivityToday: true, ratio: 0.2, todaySeconds: 42 * 60, todayCount: 2 })).toMatch(/42 minutos|Un día más/);
  });

  it("reconoce cuando hoy superaste a ayer", () => {
    expect(motivationalMessage({ ...base, hasActivityToday: true, ratio: 0.3, todaySeconds: 3600, yesterdaySeconds: 1800 })).toMatch(/ayer/i);
  });

  it("da la bienvenida de vuelta después de varios días sin registrar", () => {
    expect(motivationalMessage({ ...base, daysSinceLastActivity: 5 })).toMatch(/volv|Retomar|retom/i);
  });

  it("primer día: invita a la primera sesión", () => {
    expect(motivationalMessage({ ...base, daysSinceLastActivity: null })).toMatch(/primera|empieza|Empezá/i);
  });

  it("nuevo récord al cumplir", () => {
    expect(motivationalMessage({ ...base, completed: true, ratio: 1, isNewBestDay: true })).toMatch(/mejor día|récord/i);
  });

  it("sin emojis en los mensajes de la interfaz", () => {
    for (let d = 1; d <= 28; d++) {
      for (const c of [{}, { hour: 8 }, { completed: true, ratio: 1, streak: 3 }, { hasActivityToday: true, ratio: 0.6 }, { daysSinceLastActivity: 4 }]) {
        expect(motivationalMessage({ ...base, ...c, dateKey: `2026-10-${String(d).padStart(2, "0")}` })).not.toMatch(/\p{Extended_Pictographic}/u);
      }
    }
    expect(rewardMessage("goal", 3)).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("formatea duraciones en palabras", () => {
    expect(humanDuration(42 * 60)).toBe("42 minutos");
    expect(humanDuration(3900)).toBe("1 hora y 5 minutos");
    expect(humanDuration(7200)).toBe("2 horas");
  });
});

describe("planes de sesión (Pomodoro, bloques)", () => {
  it("calcula el bloque actual y lo que falta", () => {
    const pomodoro = presetFor("pomodoro");
    expect(blockState(pomodoro, 0)).toMatchObject({ block: 1, remaining: 1500, completedBlocks: 0 });
    expect(blockState(pomodoro, 26 * 60)).toMatchObject({ block: 2, completedBlocks: 1, remaining: 24 * 60 });
    expect(blockState(presetFor("free"), 600)).toBeNull();
    expect(presetFor("desconocido").methodId).toBe("free");
  });
});

describe("calendario: racha del mes", () => {
  it("cuenta la racha más larga dentro del rango", () => {
    const done = new Set(["2026-09-29", "2026-09-30", "2026-10-01", "2026-10-02", "2026-10-05", "2026-10-06"]);
    expect(longestRunInRange(done, "2026-10-01", "2026-10-31")).toBe(2);
    expect(longestRunInRange(done, "2026-09-01", "2026-10-31")).toBe(4);
    expect(longestRunInRange(new Set(), "2026-10-01", "2026-10-31")).toBe(0);
    expect(longestRunInRange(done, "2026-10-31", "2026-10-01")).toBe(0);
  });
});
