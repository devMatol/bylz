import { useState } from "react";
import { formatAmount } from "../../lib/utils";

interface MonthlyDataPoint {
  month: string;
  ca: number;
  tvaCollected?: number;
  tvaDeductible?: number;
}

interface FiscalChartsProps {
  monthlyData: MonthlyDataPoint[];
  caThreshold: number;
  tvaThreshold: number;
}

export function FiscalCharts({ monthlyData, caThreshold, tvaThreshold }: FiscalChartsProps) {
  const [hoveredPoint, setHoveredPoint] = useState<MonthlyDataPoint | null>(null);

  const maxDataVal = Math.max(
    ...monthlyData.map((d) => d.ca),
    caThreshold / 12 * 1.5,
    5000
  );

  const chartHeight = 220;
  const chartWidth = 700;
  const paddingX = 40;
  const paddingY = 20;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // Calculate points coordinates
  const stepX = innerWidth / Math.max(1, monthlyData.length - 1);

  const getX = (idx: number) => paddingX + idx * stepX;
  const getY = (val: number) => chartHeight - paddingY - (val / maxDataVal) * innerHeight;

  // SVG Area path for CA
  const areaPath = monthlyData.length > 0
    ? `M ${getX(0)} ${chartHeight - paddingY} ` +
      monthlyData.map((d, i) => `L ${getX(i)} ${getY(d.ca)}`).join(" ") +
      ` L ${getX(monthlyData.length - 1)} ${chartHeight - paddingY} Z`
    : "";

  // SVG Line path for CA
  const linePath = monthlyData.length > 0
    ? monthlyData.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(d.ca)}`).join(" ")
    : "";

  // Monthly average threshold line (CA ceiling / 12)
  const monthlyCaCeilingY = getY(caThreshold / 12);
  const monthlyTvaBaseY = getY(tvaThreshold / 12);

  return (
    <div className="rounded-2xl border border-border bg-surface/90 p-6 backdrop-blur-md space-y-4">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-text">Évolution du Chiffre d'Affaires Mensuel</h3>
          <p className="text-xs text-muted">Comparaison avec les seuils de tolérance fiscale et de TVA</p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-text">CA Encaissement</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-400 border border-amber-400" />
            <span className="text-muted">Moyenne TVA ({formatAmount(tvaThreshold / 12)}/mois)</span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto min-w-[500px] overflow-visible">
          <defs>
            {/* Gradient Fill for Area */}
            <linearGradient id="caAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="caLineGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>

          {/* Grid Background Horizontal Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const yVal = paddingY + innerHeight * ratio;
            const labelVal = maxDataVal * (1 - ratio);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={yVal}
                  x2={chartWidth - paddingX}
                  y2={yVal}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 8}
                  y={yVal + 3}
                  fill="rgba(148, 163, 184, 0.6)"
                  fontSize="10"
                  textAnchor="end"
                >
                  {Math.round(labelVal / 1000)}k€
                </text>
              </g>
            );
          })}

          {/* Monthly TVA Threshold Reference Line */}
          {monthlyTvaBaseY >= paddingY && monthlyTvaBaseY <= chartHeight - paddingY && (
            <g>
              <line
                x1={paddingX}
                y1={monthlyTvaBaseY}
                x2={chartWidth - paddingX}
                y2={monthlyTvaBaseY}
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="6 3"
              />
              <text
                x={chartWidth - paddingX}
                y={monthlyTvaBaseY - 4}
                fill="#f59e0b"
                fontSize="9"
                fontWeight="bold"
                textAnchor="end"
              >
                Seuil TVA Mensuel ({formatAmount(tvaThreshold / 12)})
              </text>
            </g>
          )}

          {/* Area Fill */}
          {areaPath && <path d={areaPath} fill="url(#caAreaGradient)" />}

          {/* Line Path */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="url(#caLineGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points (Circles) */}
          {monthlyData.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.ca);
            const isHovered = hoveredPoint?.month === d.month;

            return (
              <g
                key={i}
                className="cursor-pointer transition-transform duration-200"
                onMouseEnter={() => setHoveredPoint(d)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? "6" : "4"}
                  className={isHovered ? "fill-primary stroke-white stroke-2 shadow-lg" : "fill-primary stroke-slate-950 stroke-2"}
                />

                {/* X Axis Month Labels */}
                <text
                  x={cx}
                  y={chartHeight - 4}
                  fill="rgba(148, 163, 184, 0.8)"
                  fontSize="11"
                  fontWeight={isHovered ? "bold" : "normal"}
                  textAnchor="middle"
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover Tooltip Overlay */}
      {hoveredPoint && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-700/80 shadow-lg text-xs animate-fadeIn">
          <div>
            <span className="font-bold text-white">{hoveredPoint.month} : </span>
            <span className="text-emerald-400 font-extrabold">{formatAmount(hoveredPoint.ca)} encaissés</span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">
            {((hoveredPoint.ca / (tvaThreshold / 12)) * 100).toFixed(0)} % du seuil mensuel TVA
          </span>
        </div>
      )}
    </div>
  );
}
