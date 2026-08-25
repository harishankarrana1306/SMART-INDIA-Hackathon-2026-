import React, { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginPage } from './auth/LoginPage';
import AppShell from './layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import GraphPage from './pages/GraphPage';
import AuditPage from './pages/AuditPage';
import IngestionPage from './pages/IngestionPage';
import ExtractionReviewPage from './pages/ExtractionReviewPage';
import EntityResolutionPage from './pages/EntityResolutionPage';
import TimelinePage from './pages/TimelinePage';
import AlertsPage from './pages/AlertsPage';
import BriefPage from './pages/BriefPage';
import LoadingState from './components/common/LoadingState';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [targetCaseCode, setTargetCaseCode] = useState<string | undefined>(undefined);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#0B0D1B] flex items-center justify-center">
        <LoadingState message="Initializing Secure Session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleNavigateToGraph = (caseCode?: string) => {
    setTargetCaseCode(caseCode);
    setActiveTab('graph');
  };

  const getPageTitleAndSubtitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Investigative Network Dashboard',
          subtitle: 'Multi-source decision-support analytics and case activity overview',
        };
      case 'graph':
        return {
          title: 'Interactive Network Graph Visualisation',
          subtitle: 'Multi-degree relationship discovery with verified source record evidence',
        };
      case 'audit':
        return {
          title: 'Tamper-Evident SHA-256 Audit Ledger',
          subtitle: 'Cryptographic hash-chained audit log for chain-of-custody verification',
        };
      case 'ingestion':
        return {
          title: 'Document Ingestion Staging',
          subtitle: 'Phase 2: Multi-source record ingestion and parsing pipeline',
        };
      case 'extraction':
        return {
          title: 'Entity Extraction Review',
          subtitle: 'Phase 2: Human-in-the-loop review of NLP-extracted entities',
        };
      case 'resolution':
        return {
          title: 'Entity Resolution Workbench',
          subtitle: 'Phase 2: Cross-record entity deduplication and merging',
        };
      case 'timeline':
        return {
          title: 'Event Chronology Timeline',
          subtitle: 'Phase 2: Temporal relationship reconstruction',
        };
      case 'alerts':
        return {
          title: 'Investigative Pattern Alerts',
          subtitle: 'Phase 3: Advisory rule-based alerts requiring investigator review',
        };
      case 'brief':
        return {
          title: 'Executive Briefs & Reporting',
          subtitle: 'Phase 3: Standardized decision-support briefs with PDF export',
        };
      default:
        return { title: 'Network Intelligence System' };
    }
  };

  const headerInfo = getPageTitleAndSubtitle();

  return (
    <AppShell
      activeTab={activeTab}
      onTabChange={setActiveTab}
      title={headerInfo.title}
      subtitle={headerInfo.subtitle}
    >
      {activeTab === 'dashboard' && (
        <DashboardPage
          onNavigateToGraph={handleNavigateToGraph}
          onNavigateToAudit={() => setActiveTab('audit')}
        />
      )}
      {activeTab === 'graph' && <GraphPage initialCaseCode={targetCaseCode} />}
      {activeTab === 'audit' && <AuditPage />}
      {activeTab === 'ingestion' && (
        <IngestionPage onNavigateToReview={() => setActiveTab('extraction')} />
      )}
      {activeTab === 'extraction' && <ExtractionReviewPage />}
      {activeTab === 'resolution' && <EntityResolutionPage />}
      {activeTab === 'timeline' && <TimelinePage />}
      {activeTab === 'alerts' && <AlertsPage />}
      {activeTab === 'brief' && <BriefPage />}
    </AppShell>
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
