import { create } from "zustand"
import { persist, createJSONStorage, StateStorage } from "zustand/middleware"
import Cookies from "js-cookie"
import type { Workspace } from "@/generated/prisma/browser"

interface WorkspaceState {
    selectedWorkspace: Workspace | null
    hasHydrated: boolean
    setSelectedWorkspace: (workspace: Workspace | null) => void
    setHasHydrated: (state: boolean) => void
}

const cookieStorage: StateStorage = {
    getItem: (name: string) => Cookies.get(name) ?? null,
    setItem: (name: string, value: string) => Cookies.set(name, value, { expires: 365 }),
    removeItem: (name: string) => Cookies.remove(name),
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set) => ({
            selectedWorkspace: null,
            hasHydrated: false,
            setSelectedWorkspace: (workspace) => set({ selectedWorkspace: workspace }),
            setHasHydrated: (state) => set({ hasHydrated: state }),
        }),
        {
            name: "selected-workspace-id",
            storage: createJSONStorage(() => cookieStorage),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true)
            },
        }
    )
)
