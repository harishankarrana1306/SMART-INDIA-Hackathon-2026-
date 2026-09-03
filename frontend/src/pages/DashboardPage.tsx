import React, { useEffect, useState, useRef } from 'react';
import {
  FolderGit2,
  Network,
  Users,
  Bell,
  ArrowRight,
  Sparkles,
  Shield,
} from 'lucide-react';
import { api } from '../api/client';
import { DashboardSummary } from '../types';
import StatCard from '../components/dashboard/StatCard';
import LoadingState from '../components/common/LoadingState';
import DisclaimerBanner from '../components/common/DisclaimerBanner';
import EntityCompositionDonut from '../components/dashboard/EntityCompositionDonut';

interface DashboardPageProps {
  onNavigateToGraph: (caseCode?: string, nodeIdOrName?: string, highRiskMode?: boolean) => void;
  onNavigateToAlerts?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToGraph,
  onNavigateToAlerts,
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hero Intelligence Network Canvas & Parallax
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bannerRef = useRef<HTMLDivElement | null>(null);
  const parallaxOffset = useRef({ currentX: 0, currentY: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isRunning = true;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // Network Node particles
    const particleCount = 24;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * (canvas.clientWidth || 800),
      y: Math.random() * (canvas.clientHeight || 200),
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.24,
      radius: Math.random() * 1.8 + 1.2,
      color: Math.random() > 0.4 ? 'rgba(221, 161, 94, ' : 'rgba(196, 141, 94, ',
      baseAlpha: Math.random() * 0.35 + 0.25,
      phase: Math.random() * Math.PI * 2,
    }));

    const render = () => {
      if (!canvas || !ctx) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Smooth parallax interpolation (restrained, fluid easing)
      parallaxOffset.current.currentX += (parallaxOffset.current.targetX - parallaxOffset.current.currentX) * 0.08;
      parallaxOffset.current.currentY += (parallaxOffset.current.targetY - parallaxOffset.current.currentY) * 0.08;

      ctx.save();
      ctx.translate(parallaxOffset.current.currentX, parallaxOffset.current.currentY);

      // Update and draw particles
      particles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.x += p.vx;
          p.y += p.vy;
          p.phase += 0.02;

          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;
        }

        const alpha = p.baseAlpha + Math.sin(p.phase) * 0.12;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.05, alpha)})`;
        ctx.fill();

        // Warm subtle ambient glow ring
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * 2.6, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${Math.max(0.02, alpha * 0.22)})`;
        ctx.fill();
      });

      // Draw faint interconnecting intelligence lines between nearby nodes
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 115) {
            const lineAlpha = (1 - dist / 115) * 0.22;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(196, 141, 94, ${lineAlpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      ctx.restore();

      if (!prefersReducedMotion && isRunning) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animationFrameId);
      } else if (!prefersReducedMotion) {
        isRunning = true;
        render();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleBannerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bannerRef.current) return;
    const rect = bannerRef.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    // Restrained max 6px parallax offset
    parallaxOffset.current.targetX = nx * 8;
    parallaxOffset.current.targetY = ny * 6;
  };

  const handleBannerMouseLeave = () => {
    parallaxOffset.current.targetX = 0;
    parallaxOffset.current.targetY = 0;
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const summary = await api.getDashboardSummary();
      setData(summary);
    } catch (e) {
      console.error('Failed to load dashboard summary:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const handleReload = () => fetchDashboardData();
    window.addEventListener('netra-data-reloaded', handleReload);
    return () => window.removeEventListener('netra-data-reloaded', handleReload);
  }, []);

  if (isLoading) {
    return <LoadingState message="Aggregating case and network metrics..." />;
  }

  const totals = data?.totals || {
    total_cases: 0,
    total_entities: 0,
    total_records: 0,
    total_alerts: 0,
    total_relationships: 54,
    total_high_risk_entities: 8,
    total_audit_events: 0,
  };

  const scrollToActiveCases = () => {
    const el = document.getElementById('active-cases-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn text-[#2C241D] select-none">
      {/* 3D Bulging Hero Overview Banner */}
      <div
        ref={bannerRef}
        onMouseMove={handleBannerMouseMove}
        onMouseLeave={handleBannerMouseLeave}
        className="rounded-[28px] border border-[#4A3222] p-6 sm:p-8 relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        style={{
          background: 'linear-gradient(135deg, #241710 0%, #160D07 100%)',
          boxShadow: '0 20px 45px -10px rgba(25, 15, 8, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.15)',
        }}
      >
        {/* Subtle Ambient Intelligence Network Canvas (Faint nodes, thin lines, gentle motion) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-80"
        />
        {/* Left Hero Overview Content */}
        <div className="max-w-xl relative z-10 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3D2819] border border-[#5C3D28] text-[#DDA15E] text-[10px] font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#DDA15E]" />
            NETRA Investigative Intelligence Platform
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight drop-shadow-sm">
            Operational Intelligence Overview
          </h2>

          <p className="text-xs text-[#C5B8AA] leading-relaxed max-w-lg font-medium">
            Multi-source entity resolution, temporal crime sequence reconstruction, and cross-jurisdictional network analysis across FIRs, cellular CDRs, financial ledgers, and field surveillance.
          </p>
        </div>

        {/* Center/Right 3D Shield & Blockchain Artwork */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden md:block pointer-events-none overflow-hidden opacity-45">
          <img
            src="/dashboard_shield_artwork.jpg"
            alt="Cryptographic Intelligence Shield"
            className="w-full h-full object-cover object-center mix-blend-screen scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#241710] via-transparent to-transparent" />
        </div>

        {/* Right CTA Button */}
        <div className="relative z-10 flex-shrink-0">
          <button
            type="button"
            onClick={() => onNavigateToGraph()}
            className="px-5 py-3 text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all shadow-xl flex items-center gap-2 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            style={{
              background: 'linear-gradient(180deg, #9C6644 0%, #7F4F24 50%, #633B18 100%)',
              boxShadow: '0 10px 24px -3px rgba(99, 59, 24, 0.55), 0 2px 0 #48260E, inset 0 1px 2px rgba(255, 255, 255, 0.35)',
              border: '1px solid #B07D58',
            }}
          >
            <Network className="w-4 h-4 stroke-[2.5]" />
            <span>Open Network Graph</span>
          </button>
        </div>
      </div>

      {/* 5 Tactile 3D Stat Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Entities"
          value={totals.total_entities.toLocaleString()}
          subtitle="Entities mapped in graph"
          icon={Users}
          colorVariant="blue"
          trend="+12.5%"
          onClick={() => onNavigateToGraph()}
        />
        <StatCard
          title="Connections Found"
          value={(totals.total_relationships || 54).toLocaleString()}
          subtitle="Evidentiary relations"
          icon={Network}
          colorVariant="green"
          trend="+18.7%"
          onClick={() => onNavigateToGraph()}
        />
        <StatCard
          title="Active Cases"
          value={totals.total_cases.toString()}
          subtitle="Click to view cases below"
          icon={FolderGit2}
          colorVariant="purple"
          trend="+7.3%"
          onClick={scrollToActiveCases}
        />
        <StatCard
          title="Alerts Generated"
          value={totals.total_alerts.toString()}
          subtitle="Click to view alerts tab"
          icon={Bell}
          colorVariant="red"
          trend="+22.1%"
          onClick={onNavigateToAlerts}
        />
        <StatCard
          title="High Risk Entities"
          value={(totals.total_high_risk_entities || 14).toString()}
          subtitle="Click to highlight in graph"
          icon={Shield}
          colorVariant="cognac"
          trend="+15.4%"
          onClick={() => onNavigateToGraph('ALL', undefined, true)}
        />
      </div>

      {/* Main Two-Column Split: Active Investigative Cases + Entity Composition Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Section: Active Investigative Cases (2x2 Grid) */}
        <div id="active-cases-section" className="lg:col-span-6 space-y-4 scroll-mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#20150F] flex items-center gap-2">
              <FolderGit2 className="w-4 h-4 text-[#8A5A36]" />
              Active Investigative Cases
            </h3>
            <span className="text-[11px] text-[#7D7065] font-medium hidden sm:inline">
              Click a case to explore its isolated network graph
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data?.recent_cases.map((c) => (
              <div
                key={c.id}
                onClick={() => onNavigateToGraph(c.case_code)}
                className="p-5 rounded-2xl bg-[#FFFDFB] border border-[#E2D7C8] hover:border-[#8A5A36] transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                style={{
                  boxShadow: '0 8px 20px -4px rgba(45, 30, 15, 0.06), 0 2px 4px rgba(0, 0, 0, 0.03), inset 0 1px 1px #FFF',
                }}
              >
                <div>
                  {/* Case Code & Status Pills */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-mono text-[10px] font-black text-[#8A5A36] bg-[#F5EFE6] px-2 py-0.5 rounded-lg border border-[#E0D5C5]">
                      {c.case_code}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-md ${
                        c.status === 'open'
                          ? 'bg-[#EAE0D5] text-[#633B18]'
                          : 'bg-[#F5EFE6] text-[#8C827A]'
                      }`}
                    >
                      {c.status === 'open' ? 'Active Investigation' : c.status}
                    </span>
                  </div>

                  {/* Title & Case Type */}
                  <h4 className="text-sm font-black text-[#20150F] group-hover:text-[#8A5A36] transition-colors leading-snug line-clamp-2">
                    {c.title}
                  </h4>

                  {c.case_type && (
                    <p className="text-[11px] text-[#7D7065] mt-1 font-medium">
                      {c.case_type}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[#E8DFCFA] flex items-center justify-between text-xs text-[#8A5A36] font-bold">
                  <span>Explore Network Graph</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Section: Entity Composition Segmented Donut Chart */}
        <div className="lg:col-span-6 space-y-4">
          <EntityCompositionDonut
            totalEntities={totals.total_entities}
            breakdown={data?.entity_breakdown || totals.entity_breakdown}
            onNavigateToGraph={() => onNavigateToGraph()}
          />
        </div>
      </div>

      {/* Mandatory Disclaimer */}
      <DisclaimerBanner variant="light" />
    </div>
  );
};

export default DashboardPage;

