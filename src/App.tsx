/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { UserSession, MaintenanceRecord, ResolutionData, ExtraWork, AccessLog, MasterNodeStatus } from './types';
import { 
  getRecords, 
  addRecord, 
  updateRecord, 
  deleteRecord, 
  clearTestRecords,
  deleteRecordsBySchoolId,
  clearTestRecordsBySchoolId,
  getExtraWorks,
  addExtraWork,
  deleteExtraWork,
  getAccessLogs,
  fetchServerSync 
} from './utils/storage';
import LandingHero from './components/LandingHero';
import RoleSelector from './components/RoleSelector';
import ArticuladorView from './components/ArticuladorView';
import DirecaoView from './components/DirecaoView';
import CoordenacaoView from './components/CoordenacaoView';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'role_selector' | 'portal'>('landing');
  const [session, setSession] = useState<UserSession | null>(null);
  const [records, setRecords] = useState<MaintenanceRecord[]>(() => getRecords());
  const [extraWorks, setExtraWorks] = useState<ExtraWork[]>(() => getExtraWorks());
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(() => getAccessLogs());
  const [masterNodeInfo, setMasterNodeInfo] = useState<MasterNodeStatus | null>(null);

  // Initial load and periodic server sync for cross-device updates (Android, Safari, Web)
  useEffect(() => {
    let isMounted = true;

    const performSync = async () => {
      const synced = await fetchServerSync();
      if (synced && isMounted) {
        setRecords(synced.records);
        setExtraWorks(synced.extraWorks);
        if (synced.accessLogs) setAccessLogs(synced.accessLogs);
        if (synced.masterNode) setMasterNodeInfo(synced.masterNode);
      }
    };

    // Initial sync
    performSync();

    // Periodic sync every 3.5 seconds across all devices
    const interval = setInterval(performSync, 3500);

    // Sync on tab focus or visibility change (when user returns to browser on Android or iOS Safari)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performSync();
      }
    };

    window.addEventListener('focus', performSync);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', performSync);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleStartApp = () => {
    setCurrentView('role_selector');
  };

  const handleBackToLanding = () => {
    setSession(null);
    setCurrentView('landing');
  };

  const handleSelectSession = (newSession: UserSession) => {
    setSession(newSession);
    setCurrentView('portal');
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentView('role_selector');
  };

  const handleAddRecord = (record: MaintenanceRecord) => {
    const updated = addRecord(record);
    setRecords(updated);
  };

  const handleDeleteRecord = (recordId: string) => {
    const updated = deleteRecord(recordId);
    setRecords(updated);
  };

  const handleClearTestRecords = () => {
    const result = clearTestRecords();
    setRecords(result.updated);
    return result;
  };

  const handleDeleteRecordsBySchool = (schoolId: string) => {
    const updated = deleteRecordsBySchoolId(schoolId);
    setRecords(updated);
  };

  const handleClearTestRecordsBySchool = (schoolId: string) => {
    const updated = clearTestRecordsBySchoolId(schoolId);
    setRecords(updated);
  };

  const handleAddExtraWork = (work: ExtraWork) => {
    const updated = addExtraWork(work);
    setExtraWorks(updated);
  };

  const handleDeleteExtraWork = (id: string) => {
    const updated = deleteExtraWork(id);
    setExtraWorks(updated);
  };

  const handleUpdateResolution = (recordId: string, resolution: ResolutionData) => {
    const updated = updateRecord(recordId, {
      resolution,
      status: resolution.status === 'realizado' ? 'realizado' : 'nao_realizado'
    });
    setRecords(updated);
  };

  // Metrics
  const totalRecordsCount = records.length;
  const resolvedCount = records.filter(r => r.status === 'realizado').length;

  // View Routing
  const renderContent = () => {
    if (currentView === 'landing') {
      return (
        <LandingHero
          onStart={handleStartApp}
          totalRecordsCount={totalRecordsCount}
          resolvedCount={resolvedCount}
        />
      );
    }

    if (currentView === 'role_selector' || !session) {
      return (
        <RoleSelector
          onSelectSession={handleSelectSession}
          onBackToLanding={handleBackToLanding}
        />
      );
    }

    // Portal view based on active role
    if (session.role === 'articulador') {
      return (
        <ArticuladorView
          records={records}
          extraWorks={extraWorks}
          accessLogs={accessLogs}
          masterNodeInfo={masterNodeInfo}
          onAddRecord={handleAddRecord}
          onDeleteRecord={handleDeleteRecord}
          onClearTestRecords={handleClearTestRecords}
          onDeleteRecordsBySchool={handleDeleteRecordsBySchool}
          onClearTestRecordsBySchool={handleClearTestRecordsBySchool}
          onAddExtraWork={handleAddExtraWork}
          onDeleteExtraWork={handleDeleteExtraWork}
          onLogout={handleLogout}
        />
      );
    }

    if (session.role === 'direcao' && session.school) {
      return (
        <DirecaoView
          school={session.school}
          records={records}
          extraWorks={extraWorks}
          onAddRecord={handleAddRecord}
          onAddExtraWork={handleAddExtraWork}
          onLogout={handleLogout}
        />
      );
    }

    if (session.role === 'coordenacao' && session.school) {
      return (
        <CoordenacaoView
          school={session.school}
          records={records}
          extraWorks={extraWorks}
          onUpdateResolution={handleUpdateResolution}
          onAddExtraWork={handleAddExtraWork}
          onLogout={handleLogout}
        />
      );
    }

    return (
      <RoleSelector
        onSelectSession={handleSelectSession}
        onBackToLanding={handleBackToLanding}
      />
    );
  };

  return (
    <>
      {renderContent()}
      <OfflineIndicator />
    </>
  );
}
