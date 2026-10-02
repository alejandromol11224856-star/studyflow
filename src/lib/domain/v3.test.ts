import { describe, expect, it } from "vitest";
import { type MotivationContext, motivationalMessage } from "./motivation";

const base: MotivationContext = {
  dateKey: "2026-10-01",
  hour: 10,
  hasGoal: true,
  ratio: 0,
  completed: false,
  remainingSeconds: 2 * 3600,
  hasActivityToday: false,
  streak: 0,
  todayCompleted: false,
  habitsDue: 0,
  habitsDone: 0,
};

describe("mensajes motivadores (V3)", () => {
  it("celebra la racha al cumplir el día", () => {
    expect(motivationalMessage({ ...base, completed: true, ratio: 1, streak: 4, todayCompleted: true })).toMatch(/4 días seguidos/);
  });

  it("reconoce cuando se superó el objetivo", () => {
    expect(motivationalMessage({ ...base, completed: true, ratio: 1, exceeded: true })).toMatch(/superaste|Superaste/);
  });

  it("varía durante el día pero es estable dentro de una franja horaria", () => {
    expect(motivationalMessage({ ...base, hour: 9 })).toBe(motivationalMessage({ ...base, hour: 10 }));
    const days = new Set(Array.from({ length: 14 }, (_, i) => motivationalMessage({ ...base, dateKey: `2026-10-${String(i + 1).padStart(2, "0")}` })));
    expect(days.size).toBeGreaterThan(1);
  });

  it("nunca usa tono culposo o agresivo", () => {
    const contexts: Partial<MotivationContext>[] = [
      {},
      { hour: 15 },
      { hour: 21, streak: 5, ratio: 0.2 },
      { ratio: 0.6 },
      { ratio: 0.9, remainingSeconds: 600 },
      { hasGoal: false },
      { completed: true, ratio: 1 },
      { completed: true, ratio: 1, streak: 3 },
      { hasActivityToday: true, habitsDue: 3, habitsDone: 1, hasGoal: false },
    ];
    for (let d = 1; d <= 20; d++) {
      for (const c of contexts) {
        const msg = motivationalMessage({ ...base, ...c, dateKey: `2026-10-${String(d).padStart(2, "0")}` });
        expect(msg).not.toMatch(/fallaste|culpa|perdiste|deberías|vergüenza|flojo|vago/i);
        expect(msg.length).toBeGreaterThan(10);
      }
    }
  });
});
