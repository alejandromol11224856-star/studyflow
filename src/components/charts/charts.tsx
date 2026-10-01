"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  type BarShapeProps,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  type XAxisTickContentProps,
  YAxis,
} from "recharts";
import type { SeriesRow } from "@/lib/domain/stats";
import { formatAxis, formatDuration, timeTicks } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
}

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11 };

/** Escala del eje Y y formato de valores (tiempo por defecto; también % o cantidades). */
export interface ValueScale {
  ticks: (max: number) => number[];
  axis: (value: number) => string;
  value: (value: number) => string;
}

export const TIME_SCALE: ValueScale = { ticks: timeTicks, axis: formatAxis, value: formatDuration };

export const PERCENT_SCALE: ValueScale = {
  ticks: () => [0, 25, 50, 75, 100],
  axis: (v) => `${v}%`,
  value: (v) => `${Math.round(v)}%`,
};

/** Cantidades enteras ("12 días"): ticks redondos de 1, 2, 5, 10… */
export function countScale(unit: (n: number) => string): ValueScale {
  return {
    ticks: (max) => {
      const top = Math.max(max, 1);
      const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500].find((st) => top / st <= 4) ?? Math.ceil(top / 4);
      const result: number[] = [];
      for (let v = 0; v <= Math.ceil(top / step) * step; v += step) result.push(v);
      return result;
    },
    axis: (v) => String(v),
    value: (v) => unit(v),
  };
}

// ---------------------------------------------------------------------------
// Tooltip: valores con tokens de texto; el color solo en la muestra.
// ---------------------------------------------------------------------------
function ChartTooltip({
  active,
  payload,
  label,
  formatLabel,
  showTotal,
  formatValue = formatDuration,
}: Partial<TooltipContentProps<number, string>> & {
  formatLabel?: (label: string) => string;
  showTotal?: boolean;
  formatValue?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const items = payload.filter((p) => Number(p.value) > 0);
  const total = payload.reduce((acc, p) => acc + (Number(p.value) || 0), 0);
  return (
    <div className="min-w-40 rounded-xl border border-border bg-popover px-3 py-2.5 text-xs shadow-elevated">
      <p className="mb-1.5 font-medium text-foreground">{formatLabel ? formatLabel(String(label)) : label}</p>
      {items.length === 0 ? (
        <p className="text-muted-foreground">Sin actividad</p>
      ) : (
        <ul className="space-y-1">
          {[...items].reverse().map((p) => (
            <li key={String(p.dataKey)} className="flex items-center gap-2">
              <span className="size-2 shrink-0 rounded-[3px]" style={{ background: p.color }} />
              <span className="flex-1 truncate text-muted-foreground">{p.name}</span>
              <span className="font-medium tabular text-foreground">{formatValue(Number(p.value))}</span>
            </li>
          ))}
        </ul>
      )}
      {showTotal && items.length > 1 && (
        <div className="mt-1.5 flex justify-between border-t border-border pt-1.5 font-medium">
          <span className="text-muted-foreground">Total</span>
          <span className="tabular">{formatValue(total)}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barras apiladas por sección
// ---------------------------------------------------------------------------
function roundedTopPath(x: number, y: number, w: number, h: number, r: number) {
  if (r <= 0) return `M${x},${y}h${w}v${h}h${-w}Z`;
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

/** Segmento con esquinas redondeadas solo en el extremo de datos (el tope de la pila). */
function Segment(props: BarShapeProps & { isTop: boolean }) {
  const { x, y, width, height, fill, isTop } = props;
  if (!height || height <= 0 || !width) return null;
  const r = isTop ? Math.min(4, width / 2, height) : 0;
  return (
    <path
      d={roundedTopPath(x, y, width, height, r)}
      fill={fill}
      // Separador de 2px del color de la superficie entre segmentos.
      stroke="var(--card)"
      strokeWidth={2}
      paintOrder="stroke"
    />
  );
}

export function StackedBarChart({
  rows,
  series,
  height = 220,
  xFormatter,
  tooltipLabel,
  highlightKey,
  className,
  scale = TIME_SCALE,
}: {
  rows: SeriesRow[];
  series: ChartSeries[];
  height?: number;
  xFormatter: (key: string) => string;
  tooltipLabel?: (key: string) => string;
  highlightKey?: string;
  className?: string;
  scale?: ValueScale;
}) {
  // Qué serie queda arriba en cada columna (para redondear solo ese extremo).
  const data = rows.map((row) => {
    let top: string | null = null;
    for (const s of series) if (Number(row[s.key] ?? 0) > 0) top = s.key;
    return { ...row, __top: top };
  });
  const ticks = scale.ticks(Math.max(0, ...rows.map((r) => r.total)));

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -12 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
          <XAxis
            dataKey="key"
            tickLine={false}
            axisLine={false}
            interval={rows.length <= 14 ? 0 : "preserveStartEnd"}
            minTickGap={8}
            tickMargin={8}
            tick={(props: XAxisTickContentProps) => {
              const value = String(props.payload?.value ?? "");
              const highlight = value === highlightKey;
              return (
                <text
                  x={props.x}
                  y={props.y}
                  dy={10}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={highlight ? 600 : 400}
                  fill={highlight ? "var(--foreground)" : "var(--muted-foreground)"}
                >
                  {xFormatter(value)}
                </text>
              );
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            tickFormatter={(v: number) => scale.axis(v)}
            width={48}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", opacity: 0.6, radius: 6 }}
            content={(props) => (
              <ChartTooltip
                {...(props as TooltipContentProps<number, string>)}
                formatLabel={tooltipLabel ?? xFormatter}
                formatValue={scale.value}
                showTotal
              />
            )}
          />
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              stackId="total"
              fill={s.color}
              maxBarSize={24}
              isAnimationActive={false}
              shape={(props: BarShapeProps) => <Segment {...props} isTop={props.payload?.__top === s.key} />}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tendencia de una sola serie (área suave + línea de 2px)
// ---------------------------------------------------------------------------
export function TrendChart({
  data,
  height = 200,
  xFormatter,
  tooltipLabel,
  name = "Tiempo",
  color = "var(--primary-text)",
  scale = TIME_SCALE,
  step = false,
}: {
  data: { key: string; total: number }[];
  height?: number;
  xFormatter: (key: string) => string;
  tooltipLabel?: (key: string) => string;
  name?: string;
  color?: string;
  scale?: ValueScale;
  /** Línea escalonada (para valores discretos como la racha). */
  step?: boolean;
}) {
  const ticks = scale.ticks(Math.max(0, ...data.map((d) => d.total)));
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeWidth={1} />
          <XAxis
            dataKey="key"
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            tickFormatter={xFormatter}
            interval="preserveStartEnd"
            minTickGap={12}
            tickMargin={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={AXIS_TICK}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            tickFormatter={(v: number) => scale.axis(v)}
            width={48}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
            content={(props) => (
              <ChartTooltip
                {...(props as TooltipContentProps<number, string>)}
                formatLabel={tooltipLabel ?? xFormatter}
                formatValue={scale.value}
              />
            )}
          />
          <Area
            type={step ? "stepAfter" : "monotone"}
            dataKey="total"
            name={name}
            stroke={color}
            strokeWidth={2}
            fill={color}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 5, stroke: "var(--card)", strokeWidth: 2, fill: color }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Leyenda con texto en tokens de texto y la muestra de color al lado. */
export function ChartLegend({ series, className }: { series: ChartSeries[]; className?: string }) {
  if (series.length < 2) return null;
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground", className)}>
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}
