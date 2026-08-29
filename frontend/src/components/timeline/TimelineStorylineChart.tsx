import React, { useState } from 'react';
import { TimelineEvent } from '../../types';
import { ShieldAlert, Zap, Filter, ChevronDown } from 'lucide-react';

export interface TimelineCluster {
  dateKey: string;
  displayDate: string;
  fullDate: string;
  events: TimelineEvent[];
  count: number;
  activityScore: number;
  activityLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  keyEntities: string[];
  eventTypes: string[];
  isHotspot: boolean;
}

interface TimelineStorylineChartProps {
  events: TimelineEvent[];
  selectedClusterDate?: string | null;
  onSelectClusterDate?: (dateKey: string | null) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  eventTypesList: Array<{ id: string; label: string }>;
  hotspotDate?: string | null;
}

export const TimelineStorylineChart: React.FC<TimelineStorylineChartProps> = ({
  events,
  selectedClusterDate,
  onSelectClusterDate,
  selectedType,
  onTypeChange,
  eventTypesList,
  hotspotDate,
}) => {
  const [hoveredCluster, setHoveredCluster] = useState<TimelineCluster | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Group events by date (YYYY-MM-DD) chronologically ascending
  const clusters: TimelineCluster[] = React.useMemo(() => {
    if (!events || events.length === 0) return [];

    const map = new Map<string, TimelineEvent[]>();

    // Sort ascending for the timeline chart left-to-right
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sorted.forEach((e) => {
      const datePart = e.timestamp ? e.timestamp.split(' ')[0] : 'Unknown';
      if (!map.has(datePart)) {
        map.set(datePart, []);
      }
      map.get(datePart)!.push(e);
    });

    const list: TimelineCluster[] = [];

    map.forEach((evts, dKey) => {
      let dObj = new Date(dKey);
      let displayDate = dKey;
      let fullDate = dKey;

      if (!isNaN(dObj.getTime())) {
        displayDate = dObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
        fullDate = dObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }

      // Calculate explainable activity score based on real case data
      let score = evts.length * 10;
      const entities = new Set<string>();
      const types = new Set<string>();

      evts.forEach((evt) => {
        types.add(evt.event_type);
        if (evt.actors) {
          evt.actors.forEach((a) => {
            const name = a.name || a.phone || a.account;
            if (name) entities.add(name);
          });
        }
        if (evt.event_type === 'financial_transaction' || evt.event_type === 'phone_communication') {
          score += 6;
        }
        if (evt.confidence && evt.confidence > 0.9) {
          score += 4;
        }
      });

      let activityLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (score >= 25 || evts.length >= 3) {
        activityLevel = 'HIGH';
      } else if (score >= 15 || evts.length >= 2) {
        activityLevel = 'MEDIUM';
      } else {
        activityLevel = 'LOW';
      }

      list.push({
        dateKey: dKey,
        displayDate,
        fullDate,
        events: evts,
        count: evts.length,
        activityScore: score,
        activityLevel,
        keyEntities: Array.from(entities).slice(0, 4),
        eventTypes: Array.from(types),
        isHotspot: false,
      });
    });

    // Identify genuine Hotspot (max activity score or threshold)
    if (list.length > 0) {
      let maxScore = -1;
      let maxIdx = -1;
      list.forEach((c, idx) => {
        if (c.activityScore > maxScore) {
          maxScore = c.activityScore;
          maxIdx = idx;
        }
      });
      if (maxIdx >= 0 && (list[maxIdx].activityScore >= 18 || list.length === 1)) {
        list[maxIdx].isHotspot = true;
      }
    }

    return list;
  }, [events]);

  // Width & height calculation for SVG chart
  const width = 900;
  const height = 240;
  const paddingLeft = 70;
  const paddingRight = 60;
  const paddingTop = 50;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Calculate coordinates for points
  const points = React.useMemo(() => {
    if (clusters.length === 0) return [];
    if (clusters.length === 1) {
      return [
        {
          x: paddingLeft + chartWidth / 2,
          y: paddingTop + chartHeight * 0.3,
          cluster: clusters[0],
        },
      ];
    }

    const maxScore = Math.max(...clusters.map((c) => c.activityScore), 30);
    const minScore = Math.min(...clusters.map((c) => c.activityScore), 5);
    const scoreRange = Math.max(maxScore - minScore, 10);

    return clusters.map((c, i) => {
      const x = paddingLeft + (i / (clusters.length - 1)) * chartWidth;
      // Invert Y so high scores are closer to top
      const normalized = (c.activityScore - minScore) / scoreRange;
      // y ranges from 0.15 (High) to 0.85 (Low)
      const y = paddingTop + chartHeight * (0.85 - normalized * 0.7);
      return { x, y, cluster: c };
    });
  }, [clusters, chartWidth, chartHeight]);

  // Smooth Bezier Curve generator
  const curvePath = React.useMemo(() => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${paddingLeft} ${points[0].y} L ${width - paddingRight} ${points[0].y}`;
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points]);

  // Area path below the curve
  const areaPath = React.useMemo(() => {
    if (points.length === 0) return '';
    const baseY = height - paddingBottom;
    if (points.length === 1) {
      return `M ${points[0].x - 60} ${baseY} L ${points[0].x - 60} ${points[0].y} L ${points[0].x + 60} ${points[0].y} L ${points[0].x + 60} ${baseY} Z`;
    }

    let d = `M ${points[0].x} ${baseY} L ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    d += ` L ${points[points.length - 1].x} ${baseY} Z`;
    return d;
  }, [points, height, paddingBottom]);

  // Hotspot node point
  const hotspotPoint = points.find((p) => p.cluster.isHotspot || p.cluster.dateKey === hotspotDate);

  const getColorByLevel = (level: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (level) {
      case 'HIGH':
        return {
          stroke: '#E05A47',
          fill: '#E05A47',
          glow: 'rgba(224, 90, 71, 0.45)',
          badgeBg: '#451A14',
          badgeText: '#FCA5A5',
        };
      case 'MEDIUM':
        return {
          stroke: '#F59E0B',
          fill: '#F59E0B',
          glow: 'rgba(245, 158, 11, 0.45)',
          badgeBg: '#3B240B',
          badgeText: '#FCD34D',
        };
      case 'LOW':
      default:
        return {
          stroke: '#38BDF8',
          fill: '#38BDF8',
          glow: 'rgba(56, 189, 248, 0.45)',
          badgeBg: '#0E2938',
          badgeText: '#7DD3FC',
        };
    }
  };

  return (
    <div className="relative w-full rounded-[28px] bg-[#140D08] border border-[#2E1C11] p-5 text-[#E5DACB] shadow-2xl overflow-hidden select-none">
      {/* Background Subtle Grid Texture */}
      <div className="absolute inset-0 bg-[radial-gradient(#3E2819_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

      {/* Top Header Bar inside Chart Card: Event Type Filter + Activity Legend */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 pb-3 border-b border-[#2C190F]">
        {/* Event Type Filter Dropdown */}
        <div className="relative inline-block min-w-[170px]">
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="w-full appearance-none pl-3.5 pr-8 py-1.5 text-xs font-bold bg-[#20140D] border border-[#3E2819] rounded-xl text-[#F5EFE6] hover:border-[#8A5A36] focus:outline-none cursor-pointer transition-all shadow-inner"
          >
            {eventTypesList.map((t) => (
              <option key={t.id} value={t.id} className="bg-[#20140D] text-white">
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#8C7A6B] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Explainable Activity Color Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold text-[#B5A89B]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E05A47] shadow-[0_0_8px_#E05A47]" />
            <span>High Activity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
            <span>Medium Activity</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
            <span>Low Activity</span>
          </div>
        </div>
      </div>

      {/* Main SVG Activity Chart */}
      <div className="relative w-full overflow-x-auto scrollbar-none py-1">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[700px] h-[210px] sm:h-[240px] overflow-visible"
        >
          <defs>
            {/* Area Gradient under curve */}
            <linearGradient id="timelineAreaGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E05A47" stopOpacity="0.45" />
              <stop offset="40%" stopColor="#F59E0B" stopOpacity="0.40" />
              <stop offset="80%" stopColor="#38BDF8" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.15" />
            </linearGradient>

            <linearGradient id="curveStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#E05A47" />
              <stop offset="45%" stopColor="#F59E0B" />
              <stop offset="85%" stopColor="#38BDF8" />
            </linearGradient>

            <linearGradient id="verticalMaskGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.05" />
            </linearGradient>

            <mask id="areaMask">
              <rect x="0" y="0" width={width} height={height} fill="url(#verticalMaskGrad)" />
            </mask>
          </defs>

          {/* Y-Axis Horizontal Reference Guidelines */}
          {/* High Grid Line */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight * 0.15}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight * 0.15}
            stroke="#2E1C11"
            strokeDasharray="4 4"
          />
          <text
            x={paddingLeft - 12}
            y={paddingTop + chartHeight * 0.15 + 4}
            textAnchor="end"
            className="text-[10px] font-mono font-bold fill-[#8C7A6B]"
          >
            High
          </text>

          {/* Medium Grid Line */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight * 0.5}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight * 0.5}
            stroke="#2E1C11"
            strokeDasharray="4 4"
          />
          <text
            x={paddingLeft - 12}
            y={paddingTop + chartHeight * 0.5 + 4}
            textAnchor="end"
            className="text-[10px] font-mono font-bold fill-[#8C7A6B]"
          >
            Medium
          </text>

          {/* Low Grid Line */}
          <line
            x1={paddingLeft}
            y1={paddingTop + chartHeight * 0.85}
            x2={width - paddingRight}
            y2={paddingTop + chartHeight * 0.85}
            stroke="#2E1C11"
            strokeDasharray="4 4"
          />
          <text
            x={paddingLeft - 12}
            y={paddingTop + chartHeight * 0.85 + 4}
            textAnchor="end"
            className="text-[10px] font-mono font-bold fill-[#8C7A6B]"
          >
            Low
          </text>

          {/* Y-Axis Rotated Label */}
          <text
            x={-(paddingTop + chartHeight / 2)}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            className="text-[10px] font-black uppercase tracking-widest fill-[#7D6B5D]"
          >
            Network Activity
          </text>

          {/* X-Axis Baseline */}
          <line
            x1={paddingLeft - 10}
            y1={height - paddingBottom}
            x2={width - paddingRight + 10}
            y2={height - paddingBottom}
            stroke="#3E2819"
            strokeWidth="1.5"
          />

          {/* Under-Curve Gradient Fill Area */}
          {areaPath && (
            <path
              d={areaPath}
              fill="url(#timelineAreaGrad)"
              mask="url(#areaMask)"
              className="transition-all duration-500"
            />
          )}

          {/* Smooth Trend Curve Line */}
          {curvePath && (
            <path
              d={curvePath}
              fill="none"
              stroke="url(#curveStrokeGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_10px_rgba(245,158,11,0.5)] transition-all duration-500"
            />
          )}

          {/* Hotspot Vertical Guide Line connecting down to timeline */}
          {hotspotPoint && (
            <g className="animate-pulse">
              <line
                x1={hotspotPoint.x}
                y1={hotspotPoint.y}
                x2={hotspotPoint.x}
                y2={height - paddingBottom}
                stroke="#F59E0B"
                strokeWidth="1.5"
                strokeDasharray="3 3"
                className="opacity-80"
              />
            </g>
          )}

          {/* Interactive Plotted Data Points & Floating Event Counts */}
          {points.map((p, idx) => {
            const colors = getColorByLevel(p.cluster.activityLevel);
            const isSelected = selectedClusterDate === p.cluster.dateKey;
            const isHot = p.cluster.isHotspot;

            return (
              <g
                key={p.cluster.dateKey || idx}
                className="cursor-pointer group"
                onClick={() => {
                  if (onSelectClusterDate) {
                    onSelectClusterDate(isSelected ? null : p.cluster.dateKey);
                  }
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredCluster(p.cluster);
                  setTooltipPos({ x: p.x, y: p.y });
                }}
                onMouseLeave={() => setHoveredCluster(null)}
              >
                {/* Floating Event Count Number above the point */}
                <text
                  x={p.x}
                  y={p.y - 14}
                  textAnchor="middle"
                  className={`text-xs font-black font-mono transition-transform duration-200 ${
                    isHot ? 'fill-[#F59E0B] scale-110' : 'fill-white'
                  }`}
                  style={{ filter: `drop-shadow(0 1px 3px rgba(0,0,0,0.8))` }}
                >
                  {p.cluster.count}
                </text>

                {/* Outer Glow Halo */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 14 : isHot ? 12 : 9}
                  fill={colors.glow}
                  className="transition-all duration-200"
                />

                {/* Node Disc */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 8 : isHot ? 7 : 5.5}
                  fill="#140D08"
                  stroke={colors.stroke}
                  strokeWidth={isHot || isSelected ? '3.5' : '2.5'}
                  className="transition-all duration-200 transform group-hover:scale-125"
                />

                {/* Center Core Dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={2.5}
                  fill={colors.fill}
                />

                {/* X-Axis Date Label */}
                <text
                  x={p.x}
                  y={height - paddingBottom + 20}
                  textAnchor="middle"
                  className={`text-xs font-bold transition-colors ${
                    isHot
                      ? 'fill-[#F59E0B] font-black'
                      : isSelected
                      ? 'fill-white font-black'
                      : 'fill-[#A89A8C] group-hover:fill-white'
                  }`}
                >
                  {p.cluster.displayDate}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Telemetry Tooltip */}
        {hoveredCluster && tooltipPos && (
          <div
            className="absolute z-30 pointer-events-none p-3 rounded-2xl bg-[#1F140D] border border-[#523522] shadow-2xl text-white text-xs space-y-1.5 animate-fadeIn backdrop-blur-md"
            style={{
              left: `${Math.min(Math.max(tooltipPos.x - 90, 10), width - 200)}px`,
              top: `${Math.max(tooltipPos.y - 110, 10)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#3E2819] pb-1">
              <span className="font-bold text-[#F5EFE6]">{hoveredCluster.fullDate}</span>
              <span
                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  hoveredCluster.activityLevel === 'HIGH'
                    ? 'bg-rose-900/80 text-rose-300 border border-rose-700'
                    : hoveredCluster.activityLevel === 'MEDIUM'
                    ? 'bg-amber-900/80 text-amber-300 border border-amber-700'
                    : 'bg-sky-900/80 text-sky-300 border border-sky-700'
                }`}
              >
                {hoveredCluster.activityLevel} ACTIVITY
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="font-bold">{hoveredCluster.count} Events Recorded</span>
            </div>

            {hoveredCluster.keyEntities.length > 0 && (
              <div className="text-[10.5px] text-[#C5B8AA]">
                <span className="text-[#8C7A6B]">Actors: </span>
                <span>{hoveredCluster.keyEntities.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hotspot Visual Bridge Indicator below chart */}
      {hotspotPoint && (
        <div className="relative flex flex-col items-center justify-center mt-1 select-none pointer-events-none">
          <div className="text-[10px] font-black font-mono uppercase text-[#F59E0B] tracking-wider">
            {hotspotPoint.cluster.displayDate}
          </div>
          <div className="mt-0.5 px-3 py-0.5 rounded-full bg-[#4A2610] border border-[#F59E0B] text-[#F59E0B] text-[9px] font-black uppercase tracking-widest shadow-[0_0_12px_rgba(245,158,11,0.5)] flex items-center gap-1 animate-pulse">
            <Zap className="w-3 h-3 text-[#F59E0B]" />
            <span>HOT SPOT</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineStorylineChart;
