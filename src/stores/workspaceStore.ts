import { create } from 'zustand';

interface WorkspaceState {
  /** The user ID whose data we're currently viewing/editing */
  activeOwnerId: string | null;
  activeOwnerName: string | null;
  isOwnWorkspace: boolean;
  setWorkspace: (ownerId: string | null, ownerName: string | null, isOwn: boolean) => void;
  reset: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeOwnerId: null,
  activeOwnerName: null,
  isOwnWorkspace: true,
  setWorkspace: (activeOwnerId, activeOwnerName, isOwn) =>
    set({ activeOwnerId, activeOwnerName, isOwnWorkspace: isOwn }),
  reset: () => set({ activeOwnerId: null, activeOwnerName: null, isOwnWorkspace: true }),
}));
