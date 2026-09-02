import React, { useState } from 'react';
import {
  Users,
  Phone,
  Landmark,
  Car,
  MapPin,
  Building2,
  PieChart as PieIcon,
  ArrowUpRight,
} from 'lucide-react';

export interface EntityCompositionProps {
  totalEntities?: number;
  breakdown?: Record<string, number>;
  onNavigateToGraph?: () => void;
}

interface SegmentConfig {
  key: string;
  label: string;
  count: number;
  color: string;
  gradient: [string, string];
  hoverColor: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  bgPill: string;
  textPill: string;
  barGradient: string;
  shadowColor: string;
}

export const EntityCompositionDonut: React.FC<EntityCompositionProps> = ({
  totalEntities,
  breakdown,
  onNavigateToGraph,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Dynamic breakdown parsing
  const rawData: Record<string, number> = {
    Person: breakdown?.Person ?? 16,
    Phone: breakdown?.Phone ?? 11,
    'Bank Account': breakdown?.['Bank Account'] ?? breakdown?.BankAccount ?? 5,
    Vehicle: breakdown?.Vehicle ?? 5,
    Location: breakdown?.Location ?? 7,
    Organization: breakdown?.Organization ?? breakdown?.Organisation ?? 5,
  };

  // Exact calculated total (guaranteed 100% sum consistency)
  const calculatedSum = Object.values(rawData).reduce((acc, curr) => acc + curr, 0);
  const total = calculatedSum > 0 ? calculatedSum : (totalEntities || 49);

  const segments: SegmentConfig[] = [
    {
      key: 'Person',
      label: 'Person',
      count: rawData.Person || 0,
      color: '#3B82F6',
      gradient: ['#60A5FA', '#2563EB'],
      hoverColor: '#1D4ED8',
      icon: Users,
      iconBg: 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/25',
      bgPill: 'bg-[#EFF6FF] border-[#BFDBFE]',
      textPill: 'text-[#1D4ED8]',
      barGradient: 'from-blue-400 to-blue-600',
      shadowColor: 'rgba(59, 130, 246, 0.45)',
    },
    {
      key: 'Phone',
      label: 'Phone',
      count: rawData.Phone || 0,
      color: '#8B5CF6',
      gradient: ['#A78BFA', '#7C3AED'],
      hoverColor: '#6D28D9',
      icon: Phone,
      iconBg: 'bg-gradient-to-br from-purple-500 to-purple-600 shadow-purple-500/25',
      bgPill: 'bg-[#F5F3FF] border-[#DDD6FE]',
      textPill: 'text-[#6D28D9]',
      barGradient: 'from-purple-400 to-purple-600',
      shadowColor: 'rgba(139, 92, 246, 0.45)',
    },
    {
      key: 'Bank Account',
      label: 'Bank Account',
      count: rawData['Bank Account'] || 0,
      color: '#10B981',
      gradient: ['#34D399', '#059669'],
      hoverColor: '#047857',
      icon: Landmark,
      iconBg: 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/25',
      bgPill: 'bg-[#ECFDF5] border-[#A7F3D0]',
      textPill: 'text-[#047857]',
      barGradient: 'from-emerald-400 to-emerald-600',
      shadowColor: 'rgba(16, 185, 129, 0.45)',
    },
    {
      key: 'Vehicle',
      label: 'Vehicle',
      count: rawData.Vehicle || 0,
      color: '#F59E0B',
      gradient: ['#FBBF24', '#D97706'],
      hoverColor: '#B45309',
      icon: Car,
      iconBg: 'bg-gradient-to-br from-amber-500 to-amber-600 shadow-amber-500/25',
      bgPill: 'bg-[#FFFBEB] border-[#FDE68A]',
      textPill: 'text-[#B45309]',
      barGradient: 'from-amber-400 to-amber-600',
      shadowColor: 'rgba(245, 158, 11, 0.45)',
    },
    {
      key: 'Location',
      label: 'Location',
      count: rawData.Location || 0,
      color: '#06B6D4',
      gradient: ['#22D3EE', '#0891B2'],
      hoverColor: '#0E7490',
      icon: MapPin,
      iconBg: 'bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-cyan-500/25',
      bgPill: 'bg-[#ECFEFF] border-[#A5F3FC]',
      textPill: 'text-[#0E7490]',
      barGradient: 'from-cyan-400 to-cyan-600',
      shadowColor: 'rgba(6, 182, 212, 0.45)',
    },
    {
      key: 'Organization',
      label: 'Organization',
      count: rawData.Organization || 0,
      color: '#F43F5E',
      gradient: ['#FB7185', '#E11D48'],
      hoverColor: '#BE123C',
      icon: Building2,
      iconBg: 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-500/25',
      bgPill: 'bg-[#FFF1F2] border-[#FECDD3]',
      textPill: 'text-[#BE123C]',
      barGradient: 'from-rose-400 to-rose-600',
      shadowColor: 'rgba(244, 63, 94, 0.45)',
    },
  ];

  // SVG Geometry Settings
  const size = 230;
  const strokeWidth = 24;
  const radius = (size - strokeWidth - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapSize = 5; // Clean separation gap between slices in pixels

  let accumulatedPercent = 0;
  const activeSegment = segments.find((s) => s.key === hoveredKey);

  return (
    <div
      className="p-5 sm:p-6 rounded-3xl bg-[#FFFDFB] border border-[#E2D7C8] space-y-5 transition-all relative overflow-hidden"
      style={{
        boxShadow:
          '0 12px 32px -6px rgba(45, 30, 15, 0.08), 0 2px 6px rgba(0, 0, 0, 0.03), inset 0 1px 1px #FFF',
      }}
    >
      {/* Background Ambient Glow */}
      <div
        className="absolute -right-16 -top-16 w-52 h-52 rounded-full pointer-events-none opacity-20 blur-3xl transition-colors duration-500"
        style={{
          backgroundColor: activeSegment ? activeSegment.color : '#9C6644',
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-[#F5EFE6] to-[#EAE1D5] rounded-xl border border-[#E0D5C5] text-[#8A5A36] shadow-2xs">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#20150F] flex items-center gap-2">
              Entity Composition
              <span className="text-[10px] font-bold text-[#8A5A36] bg-[#F5EFE6] px-2 py-0.5 rounded-full border border-[#E0D5C5]">
                {total} Total
              </span>
            </h3>
            <p className="text-[11px] text-[#7D7065] font-semibold">
              Real-time multi-source classification
            </p>
          </div>
        </div>

        {onNavigateToGraph && (
          <button
            type="button"
            onClick={onNavigateToGraph}
            className="text-[11px] font-bold text-[#8A5A36] hover:text-[#5C381E] transition-colors flex items-center gap-1 cursor-pointer group bg-[#FAF7F2] hover:bg-[#F5EFE6] px-2.5 py-1 rounded-lg border border-[#E5DACB]"
          >
            <span>Explore Graph</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Main Grid: Visual Donut Chart on Left + Segment List on Right */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center relative z-10">
        {/* Left: SVG Segmented Donut Chart */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-[210px] h-[210px] flex items-center justify-center">
            <svg
              width={210}
              height={210}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90"
            >
              <defs>
                {segments.map((seg) => (
                  <linearGradient
                    key={`grad-${seg.key}`}
                    id={`grad-${seg.key.replace(/\s+/g, '')}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor={seg.gradient[0]} />
                    <stop offset="100%" stopColor={seg.gradient[1]} />
                  </linearGradient>
                ))}
              </defs>

              {/* Outer Decorative Dashed Radar Ring */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius + 14}
                fill="none"
                stroke="#EAE0D5"
                strokeWidth={1}
                strokeDasharray="3 4"
                className="opacity-75"
              />

              {/* Background Track Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#F3ECE3"
                strokeWidth={strokeWidth}
              />

              {/* Segmented Slices with Rich Gradients & Separation Gaps */}
              {segments.map((seg) => {
                const fraction = total > 0 ? seg.count / total : 0;
                const strokeDash = Math.max(0, fraction * circumference - gapSize);
                const strokeOffset = circumference - accumulatedPercent * circumference;
                accumulatedPercent += fraction;

                const isHovered = hoveredKey === seg.key;
                const isAnyHovered = hoveredKey !== null;
                const isDimmed = isAnyHovered && !isHovered;

                return (
                  <circle
                    key={seg.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#grad-${seg.key.replace(/\s+/g, '')})`}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    onMouseEnter={() => setHoveredKey(seg.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      opacity: isDimmed ? 0.35 : 1,
                      filter: isHovered
                        ? `drop-shadow(0 0 10px ${seg.shadowColor})`
                        : 'drop-shadow(0 1px 2px rgba(0,0,0,0.06))',
                    }}
                  />
                );
              })}
            </svg>

            {/* Central Hollow Medallion */}
            <div className="absolute inset-0 m-auto w-[124px] h-[124px] rounded-full bg-gradient-to-b from-[#FFFDFB] via-[#FAF7F2] to-[#F5EFE6] border border-[#E5DACB] shadow-inner flex flex-col items-center justify-center pointer-events-none text-center p-2 transition-all duration-300">
              {activeSegment ? (
                <>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white mb-1 shadow-xs transition-transform transform scale-110"
                    style={{ backgroundColor: activeSegment.color }}
                  >
                    <activeSegment.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xl font-black text-[#20150F] tracking-tight leading-none">
                    {activeSegment.count}
                  </span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#8A5A36] mt-0.5 truncate max-w-[100px]">
                    {activeSegment.label}
                  </span>
                  <span className="text-[9px] font-bold text-[#7D7065]">
                    {Math.round((activeSegment.count / (total || 1)) * 100)}% of total
                  </span>
                </>
              ) : (
                <>
                  <span className="text-3xl font-black text-[#20150F] tracking-tight leading-none">
                    {total}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8A5A36] mt-1">
                    ENTITIES
                  </span>
                  <span className="text-[9px] font-bold text-[#9C8F82] mt-0.5">
                    100% Resolved
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Detailed Entity Split Grid */}
        <div className="sm:col-span-7 space-y-2">
          {segments.map((seg) => {
            const Icon = seg.icon;
            const percentage = Math.round((seg.count / (total || 1)) * 100);
            const isHovered = hoveredKey === seg.key;

            return (
              <div
                key={seg.key}
                onMouseEnter={() => setHoveredKey(seg.key)}
                onMouseLeave={() => setHoveredKey(null)}
                className={`p-2.5 rounded-xl border transition-all duration-200 flex flex-col gap-1.5 cursor-pointer relative overflow-hidden ${
                  isHovered
                    ? 'bg-[#FAF7F2] border-[#8A5A36] shadow-sm transform translate-x-1.5'
                    : 'bg-white border-[#EAE0D5] hover:bg-[#FAF6F2]'
                }`}
              >
                {/* Active Left Colored Border Accent */}
                {isHovered && (
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l"
                    style={{ backgroundColor: seg.color }}
                  />
                )}

                <div className="flex items-center justify-between">
                  {/* Left: Icon + Label */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-2xs flex-shrink-0 ${seg.iconBg}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-[#20150F] leading-tight">
                        {seg.label}
                      </div>
                      <div className="text-[10px] text-[#7D7065] font-semibold">
                        {percentage}% representation
                      </div>
                    </div>
                  </div>

                  {/* Right: Count Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-lg border ${seg.bgPill} ${seg.textPill}`}
                    >
                      {seg.count}
                    </span>
                  </div>
                </div>

                {/* Micro Progress Bar */}
                <div className="w-full bg-[#F3ECE3] h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${seg.barGradient} transition-all duration-500`}
                    style={{ width: `${Math.max(percentage, 4)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EntityCompositionDonut;
