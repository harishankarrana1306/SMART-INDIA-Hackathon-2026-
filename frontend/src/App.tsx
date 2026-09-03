import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './auth/LoginPage';
import AppShell from './layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import GraphPage from './pages/GraphPage';
import IngestionPage from './pages/IngestionPage';
import ExtractionReviewPage from './pages/ExtractionReviewPage';
import EntityResolutionPage from './pages/EntityResolutionPage';
import AlertsPage from './pages/AlertsPage';
import BriefPage from './pages/BriefPage';
import TimelinePage from './pages/TimelinePage';
import AuditPage from './pages/AuditPage';
import LoadingState from './components/common/LoadingState';
import { useRealtimeAuditTracker } from './hooks/useRealtimeAuditTracker';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading, user, setSessionData } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [targetCaseCode, setTargetCaseCode] = useState<string | undefined>(undefined);
  const [targetNodeId, setTargetNodeId] = useState<string | undefined>(undefined);
  const [targetHighRiskMode, setTargetHighRiskMode] = useState<boolean>(false);
  const [targetHighlightNodeIds, setTargetHighlightNodeIds] = useState<string[] | undefined>(undefined);
  const [timelineEntityFilter, setTimelineEntityFilter] = useState<string | undefined>(undefined);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Real-time audit recording of clicks and actions across the application
  useRealtimeAuditTracker(activeTab);

  const handleLoginSuccess = (data: { token: string; user: any }) => {
    setSessionData(data.token, data.user);
  };

  // Full application state reset listener on demo data reload
  useEffect(() => {
    const handleReload = () => {
      setReloadKey((prev) => prev + 1);
      setTargetCaseCode('FIC-CASE-0001');
      setTargetNodeId(undefined);
      setTargetHighRiskMode(false);
      setTargetHighlightNodeIds(undefined);
      setTimelineEntityFilter(undefined);
    };
    window.addEventListener('netra-data-reloaded', handleReload);
    return () => window.removeEventListener('netra-data-reloaded', handleReload);
  }, []);

  const handleRefreshData = () => {
    setReloadKey((prev) => prev + 1);
    setTargetCaseCode('FIC-CASE-0001');
    setTargetNodeId(undefined);
    setTargetHighRiskMode(false);
    setTargetHighlightNodeIds(undefined);
    setTimelineEntityFilter(undefined);
  };

  const handleNavigateToGraph = (
    caseCode?: string,
    nodeIdOrName?: string,
    highRiskMode?: boolean,
    highlightNodeIds?: string[]
  ) => {
    if (caseCode) setTargetCaseCode(caseCode);
    if (nodeIdOrName) setTargetNodeId(nodeIdOrName);
    setTargetHighRiskMode(!!highRiskMode);
    setTargetHighlightNodeIds(
      highlightNodeIds && highlightNodeIds.length > 0
        ? highlightNodeIds
        : nodeIdOrName
        ? [nodeIdOrName]
        : undefined
    );
    setActiveTab('graph');
  };

  const handleNavigateToTimeline = (entityName?: string, caseCode?: string) => {
    if (entityName) setTimelineEntityFilter(entityName);
    if (caseCode) setTargetCaseCode(caseCode);
    setActiveTab('timeline');
  };

  const getPageTitleAndSubtitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Investigative Intelligence Dashboard',
          subtitle: 'Multi-source decision-support analytics and case activity overview',
        };
      case 'graph':
        return {
          title: 'Interactive Network Graph Visualisation',
          subtitle: 'Multi-degree relationship discovery with verified source record evidence',
        };
      case 'ingestion':
        return {
          title: 'Document Ingestion Staging',
          subtitle: 'Multi-source record ingestion and hybrid parsing pipeline',
        };
      case 'extraction':
        return {
          title: 'Entity Extraction Review',
          subtitle: 'Human-in-the-loop review of NLP-extracted entities categorized by data type',
        };
      case 'resolution':
        return {
          title: 'Entity Resolution Workbench',
          subtitle: 'Cross-record entity deduplication, alias grouping, and merge authorization',
        };
      case 'alerts':
        return {
          title: 'Investigation Alerts & Pattern Detection',
          subtitle: 'Explainable heuristic pattern alerts prioritizing high-impact network indicators',
        };
      case 'brief':
        return {
          title: 'Executive Briefs & PDF Reporting',
          subtitle: 'Standardized 10-section case intelligence summaries with tamper-evident PDF export',
        };
      case 'timeline':
        return {
          title: 'Crime Timeline & Temporal Sequence Reconstruction',
          subtitle: 'Unified temporal sequence reconstruction across multi-source events with evidentiary citations',
        };
      case 'audit':
        return {
          title: 'Tamper-Proof Audit & Cryptographic Chain',
          subtitle: 'Append-only SHA-256 hash-chain integrity verification and supervisory governance stream',
        };
      default:
        return { title: 'NETRA Intelligence System' };
    }
  };

  const headerInfo = getPageTitleAndSubtitle();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#FBF8F3] flex items-center justify-center">
        <LoadingState message="Initializing Secure Session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="h-full w-full">
        <AppShell
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
          }}
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onRefreshData={handleRefreshData}
          onNavigateToGraph={handleNavigateToGraph}
          onNavigateToAlerts={() => setActiveTab('alerts')}
          onNavigateToTimeline={handleNavigateToTimeline}
        >
          <div key={reloadKey} className="h-full w-full">
            {activeTab === 'dashboard' && (
              <DashboardPage
                onNavigateToGraph={handleNavigateToGraph}
                onNavigateToAlerts={() => setActiveTab('alerts')}
              />
            )}
            {activeTab === 'graph' && (
              <GraphPage
                initialCaseCode={targetCaseCode || 'FIC-CASE-0001'}
                initialNodeId={targetNodeId}
                initialHighRiskMode={targetHighRiskMode}
                initialHighlightNodeIds={targetHighlightNodeIds}
                onNavigateToTimeline={handleNavigateToTimeline}
              />
            )}
            {activeTab === 'ingestion' && (
              <IngestionPage onNavigateToReview={() => setActiveTab('extraction')} />
            )}
            {activeTab === 'extraction' && (
              <ExtractionReviewPage onNavigateToGraph={handleNavigateToGraph} />
            )}
            {activeTab === 'resolution' && (
              <EntityResolutionPage onNavigateToGraph={handleNavigateToGraph} />
            )}
            {activeTab === 'alerts' && (
              <AlertsPage onNavigateToGraph={handleNavigateToGraph} />
            )}
            {activeTab === 'brief' && <BriefPage />}
            {activeTab === 'timeline' && (
              <TimelinePage
                initialEntityFilter={timelineEntityFilter}
                initialCaseCode={targetCaseCode || 'FIC-CASE-0001'}
                onNavigateToGraph={handleNavigateToGraph}
              />
            )}
            {activeTab === 'audit' && user?.role === 'supervisor' && <AuditPage />}
          </div>
        </AppShell>
      </div>
    );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
};

export default App;
