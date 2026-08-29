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
  totalEntities: number;
  breakdown?: Record<string, number>;
  onNavigateToGraph?: () => void;
}

interface SegmentConfig {
  key: string;
  label: string;
  count: number;
  color: string;
  hoverColor: string;
  icon: React.ComponentType<{ className?: string }>;
  bgPill: string;
  textPill: string;
}

export const EntityCompositionDonut: React.FC<EntityCompositionProps> = ({
  totalEntities,
  breakdown,
  onNavigateToGraph,
}) => {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  // Default target split if breakdown not yet loaded
  const rawData: Record<string, number> = {
    Person: breakdown?.Person ?? 24,
    Phone: breakdown?.Phone ?? 10,
    'Bank Account': breakdown?.['Bank Account'] ?? breakdown?.BankAccount ?? 8,
    Vehicle: breakdown?.Vehicle ?? 5,
    Location: breakdown?.Location ?? 4,
    Organization: breakdown?.Organization ?? breakdown?.Organisation ?? 3,
  };

  const total = totalEntities || Object.values(rawData).reduce((a, b) => a + b, 0) || 54;

  const segments: SegmentConfig[] = [
    {
      key: 'Person',
      label: 'Person',
      count: rawData.Person || 0,
      color: '#4F46E5', // Indigo
      hoverColor: '#3730A3',
      icon: Users,
      bgPill: 'bg-[#EEF2FF] border-[#C7D2FE]',
      textPill: 'text-[#4338CA]',
    },
    {
      key: 'Phone',
      label: 'Phone',
      count: rawData.Phone || 0,
      color: '#7C3AED', // Purple
      hoverColor: '#5B21B6',
      icon: Phone,
      bgPill: 'bg-[#F5F3FF] border-[#DDD6FE]',
      textPill: 'text-[#6D28D9]',
    },
    {
      key: 'Bank Account',
      label: 'Bank Account',
      count: rawData['Bank Account'] || 0,
      color: '#0D9488', // Teal
      hoverColor: '#115E59',
      icon: Landmark,
      bgPill: 'bg-[#CCFBF1] border-[#99F6E4]',
      textPill: 'text-[#0F766E]',
    },
    {
      key: 'Vehicle',
      label: 'Vehicle',
      count: rawData.Vehicle || 0,
      color: '#D97706', // Amber
      hoverColor: '#92400E',
      icon: Car,
      bgPill: 'bg-[#FEF3C7] border-[#FDE68A]',
      textPill: 'text-[#B45309]',
    },
    {
      key: 'Location',
      label: 'Location',
      count: rawData.Location || 0,
      color: '#0284C7', // Sky
      hoverColor: '#075985',
      icon: MapPin,
      bgPill: 'bg-[#E0F2FE] border-[#BAE6FD]',
      textPill: 'text-[#0369A1]',
    },
    {
      key: 'Organization',
      label: 'Organization',
      count: rawData.Organization || 0,
      color: '#9333EA', // Violet
      hoverColor: '#6B21A8',
      icon: Building2,
      bgPill: 'bg-[#FAF5FF] border-[#E9D5FF]',
      textPill: 'text-[#7E22CE]',
    },
  ];

  // SVG Geometry Settings
  const size = 220;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const gapSize = 4.5; // Visual separation gap between slices in pixels

  let accumulatedPercent = 0;

  const activeSegment = segments.find((s) => s.key === hoveredKey);

  return (
    <div
      className="p-5 sm:p-6 rounded-3xl bg-[#FFFDFB] border border-[#E2D7C8] space-y-5 transition-all"
      style={{
        boxShadow: '0 10px 30px -5px rgba(45, 30, 15, 0.07), 0 2px 6px rgba(0, 0, 0, 0.03), inset 0 1px 1px #FFF',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#F5EFE6] rounded-xl border border-[#E5DACB] text-[#8A5A36]">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#20150F]">
              Entity Composition
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
            className="text-[11px] font-bold text-[#8A5A36] hover:text-[#5C381E] transition-colors flex items-center gap-1 cursor-pointer group"
          >
            <span>Explore Graph</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Main Grid: Separated Doughnut Chart on Left + Segment List on Right */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
        {/* Left: SVG Segmented Donut Chart */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-[190px] h-[190px] flex items-center justify-center">
            <svg
              width={190}
              height={190}
              viewBox={`0 0 ${size} ${size}`}
              className="transform -rotate-90"
            >
              {/* Background Track */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke="#F2EAE0"
                strokeWidth={strokeWidth}
              />

              {/* Segmented Slices with Separator Gaps */}
              {segments.map((seg) => {
                const fraction = seg.count / (total || 1);
                const strokeDash = Math.max(0, fraction * circumference - gapSize);
                const strokeOffset = circumference - accumulatedPercent * circumference;
                accumulatedPercent += fraction;

                const isHovered = hoveredKey === seg.key;

                return (
                  <circle
                    key={seg.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    stroke={isHovered ? seg.hoverColor : seg.color}
                    strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={`${strokeDash} ${circumference - strokeDash}`}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                    onMouseEnter={() => setHoveredKey(seg.key)}
                    onMouseLeave={() => setHoveredKey(null)}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      filter: isHovered
                        ? `drop-shadow(0 0 8px ${seg.color}66)`
                        : 'drop-shadow(0 1px 2px rgba(0,0,0,0.08))',
                    }}
                  />
                );
              })}
            </svg>

            {/* Hollow Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-2xl sm:text-3xl font-black text-[#20150F] tracking-tight leading-none">
                {activeSegment ? activeSegment.count : total}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#8A5A36] mt-1">
                {activeSegment ? activeSegment.label : 'ENTITIES'}
              </span>
              {activeSegment && (
                <span className="text-[9px] font-bold text-[#7D7065] mt-0.5">
                  {Math.round((activeSegment.count / (total || 1)) * 100)}% of total
                </span>
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
                className={`p-2.5 rounded-xl border transition-all duration-200 flex items-center justify-between cursor-pointer ${
                  isHovered
                    ? 'bg-[#F9F5F0] border-[#8A5A36] shadow-sm transform translate-x-1'
                    : 'bg-white border-[#EAE0D5] hover:bg-[#FAF6F2]'
                }`}
              >
                {/* Left: Icon + Label */}
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-2xs flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
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
                    className={`font-mono text-xs font-black px-2.5 py-1 rounded-lg border ${seg.bgPill} ${seg.textPill}`}
                  >
                    {seg.count}
                  </span>
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
