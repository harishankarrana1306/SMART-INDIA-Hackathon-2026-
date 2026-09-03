import { useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';

/**
 * Real-Time Audit Tracking Hook
 * Tracks user interactions, tab navigations, and clicks across the website in real time,
 * appending each event to the append-only SHA-256 cryptographic audit chain.
 */
export const useRealtimeAuditTracker = (activeTab: string) => {
  const { isAuthenticated, user } = useAuth();
  const prevTabRef = useRef<string>(activeTab);
  const lastClickRef = useRef<{ id: string; time: number }>({ id: '', time: 0 });

  // 1. Track Tab Navigations
  useEffect(() => {
    if (!isAuthenticated) return;

    if (prevTabRef.current !== activeTab) {
      const fromTab = prevTabRef.current;
      const toTab = activeTab;
      prevTabRef.current = activeTab;

      api.recordAuditAction('tab_navigation', 'navigation', toTab, {
        from_tab: fromTab,
        to_tab: toTab,
        user: user?.username,
        timestamp_client: new Date().toISOString(),
      }).then((log) => {
        if (log) {
          window.dispatchEvent(new CustomEvent('netra-audit-log-recorded', { detail: log }));
        }
      });
    }
  }, [activeTab, isAuthenticated, user?.username]);

  // 2. Global Real-time Click & Interaction Tracker
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleGlobalClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Find the interactive element clicked
      const interactiveEl = target.closest(
        'button, a, [role="button"], input[type="submit"], input[type="button"], [data-audit], .cursor-pointer'
      ) as HTMLElement | null;

      if (!interactiveEl) return;

      // Extract descriptive identifier
      const label =
        interactiveEl.getAttribute('data-audit') ||
        interactiveEl.getAttribute('title') ||
        interactiveEl.getAttribute('aria-label') ||
        interactiveEl.id ||
        interactiveEl.innerText?.trim().slice(0, 45) ||
        interactiveEl.tagName.toLowerCase();

      // Filter out overly generic or empty text
      if (!label || label.length < 2) return;

      // Throttle identical clicks within 750ms
      const now = Date.now();
      const clickKey = `${activeTab}:${label}`;
      if (lastClickRef.current.id === clickKey && now - lastClickRef.current.time < 750) {
        return;
      }
      lastClickRef.current = { id: clickKey, time: now };

      // Record to SHA-256 Audit Chain in real time
      api.recordAuditAction('user_click', 'ui_element', label, {
        tab: activeTab,
        element: interactiveEl.tagName.toLowerCase(),
        text: label,
        user: user?.username,
        timestamp_client: new Date().toISOString(),
      }).then((log) => {
        if (log) {
          window.dispatchEvent(new CustomEvent('netra-audit-log-recorded', { detail: log }));
        }
      });
    };

    window.addEventListener('click', handleGlobalClick, { capture: true });
    return () => {
      window.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, [isAuthenticated, activeTab, user?.username]);
};

export default useRealtimeAuditTracker;
