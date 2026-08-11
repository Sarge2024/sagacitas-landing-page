import { create } from 'zustand';
import { StudentProgress } from '../types';
import { TelemetryService } from '../services/TelemetryService';

interface TelemetryState {
  queue: StudentProgress[];
  isSyncing: boolean;
  
  // Actions
  queueResult: (progress: StudentProgress) => void;
  syncQueue: () => Promise<void>;
  initOfflineListeners: () => void;
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  queue: [],
  isSyncing: false,

  /**
   * Adds an OA evaluation result to the telemetry queue.
   * Immediately attempts to sync if the browser reports it is online.
   */
  queueResult: (progress: StudentProgress) => {
    set((state) => ({
      queue: [...state.queue, progress],
    }));

    if (navigator.onLine) {
      get().syncQueue();
    }
  },

  /**
   * Processes all queued OA results and attempts to submit them to Supabase
   * using the TelemetryService (which generates the HMAC signature).
   */
  syncQueue: async () => {
    const { queue, isSyncing } = get();
    
    // Prevent concurrent syncs or empty queue syncs
    if (isSyncing || queue.length === 0 || !navigator.onLine) {
      return;
    }

    set({ isSyncing: true });

    const remainingQueue = [...queue];
    const failedItems: StudentProgress[] = [];

    // Process the queue item by item
    while (remainingQueue.length > 0) {
      const item = remainingQueue.shift();
      if (!item) continue;

      const success = await TelemetryService.submitOAResult(item);
      
      if (!success) {
        // If network failed, push back to failed array to try later
        failedItems.push(item);
      }
    }

    // Update store with items that failed to sync (so they can be retried later)
    set({
      queue: [...failedItems, ...remainingQueue], // remainingQueue should be empty here, but just in case
      isSyncing: false,
    });
  },

  /**
   * Initializes the online/offline event listeners to trigger a sync
   * automatically when the connection is restored.
   */
  initOfflineListeners: () => {
    window.addEventListener('online', () => {
      console.log('[useTelemetryStore] Conexão restabelecida. Sincronizando fila de telemetria...');
      get().syncQueue();
    });

    window.addEventListener('offline', () => {
      console.warn('[useTelemetryStore] Conexão perdida. Resultados das OAs serão enfileirados localmente.');
    });
  }
}));
