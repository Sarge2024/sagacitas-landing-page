import React, { useEffect } from 'react';
import { usePlayerStore } from './store/usePlayerStore';
import { useTelemetryStore } from './store/useTelemetryStore';
import { HandshakeView } from './components/HandshakeView';
import { DashboardView } from './components/DashboardView';
import { CourseTrailView } from './components/CourseTrailView';
import { OAPlayerModal } from './components/OAPlayerModal';
import { ServiceInspectorModal } from './components/ServiceInspectorModal';
import { AuthHandshakeService } from './services/AuthHandshakeService';
import { ClientWalletView } from './components/ClientWalletView';
import { OAPlayerView } from './components/OAPlayerView';

export default function App({ user }: { user?: any }) {
  const { currentView, runHandshake, session } = usePlayerStore();

  useEffect(() => {
    // Inicializar listeners de Telemetria Offline/Online
    useTelemetryStore.getState().initOfflineListeners();

    // Perform initial handshake if not yet authenticated
    if (!session) {
      if (user) {
        runHandshake(undefined, user);
      } else {
        runHandshake();
      }
    }

    // Register cross-domain window.postMessage token listener
    const cleanup = AuthHandshakeService.listenForPostMessageToken((token) => {
      runHandshake(token);
    });

    return cleanup;
  }, []);

  return (
    <div className="h-full overflow-hidden bg-[#f8f9ff] text-[#0b1c30] relative font-['Inter'] selection:bg-[#0075d5] selection:text-white">
      {/* Dynamic Screen Routing */}
      {currentView === 'handshake' && <HandshakeView />}
      {currentView === 'dashboard' && <DashboardView />}
      {currentView === 'trail' && <CourseTrailView />}
      {currentView === 'player' && (
        <>
          <CourseTrailView />
          <OAPlayerModal />
        </>
      )}
      {currentView === 'wallet' && <ClientWalletView />}
      {currentView === 'oa_player' && <OAPlayerView />}

      {/* Global Inspector Modal for B2B SDK Debugging */}
      <ServiceInspectorModal />
    </div>
  );
}
