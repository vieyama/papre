'use client'

import * as React from 'react'
import type { Workspace } from '@/generated/prisma/browser'

const STORAGE_KEY = 'selected-workspace-id'

interface WorkspaceContextType {
  selectedWorkspace: Workspace | null
  setSelectedWorkspace: (workspace: Workspace | null) => void
}

const WorkspaceContext = React.createContext<WorkspaceContextType | undefined>(undefined)

export function WorkspaceProvider({ 
  children,
  initialWorkspace 
}: { 
  children: React.ReactNode
  initialWorkspace?: Workspace | null
}) {
  const [selectedWorkspace, setSelectedWorkspaceState] = React.useState<Workspace | null>(() => {
    // Try to get from localStorage first
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem(STORAGE_KEY)
      if (savedId && initialWorkspace) {
        // If savedId matches initialWorkspace, use it
        if (initialWorkspace.id === savedId) {
          return initialWorkspace
        }
        // Otherwise, we'll need to sync with the workspaces list later
      }
    }
    return initialWorkspace || null
  })

  const setSelectedWorkspace = React.useCallback((workspace: Workspace | null) => {
    setSelectedWorkspaceState(workspace)
    if (workspace) {
      localStorage.setItem(STORAGE_KEY, workspace.id)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  // Sync saved workspace with the provided workspaces list
  React.useEffect(() => {
    if (initialWorkspace && typeof window !== 'undefined') {
      const savedId = localStorage.getItem(STORAGE_KEY)
      if (savedId && initialWorkspace.id !== savedId) {
        // If we have a savedId but it doesn't match initialWorkspace, we'll let the WorkspaceSwitcher handle it
      }
    }
  }, [initialWorkspace])

  return (
    <WorkspaceContext.Provider value={{ selectedWorkspace, setSelectedWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const context = React.useContext(WorkspaceContext)
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider')
  }
  return context
}
