import {
    WorkspaceSwitcherClient,
    type WorkspaceWithAccess,
} from "./workspace-switcher-client"

/**
 * Server Component — reads cookie server-side so the correct workspace
 * is known at render time, eliminating the blank-flash on reload.
 */
export async function WorkspaceSwitcher({
    workspaces,
    selectedWorkspace: initialSelectedWorkspace,
}: {
    workspaces: WorkspaceWithAccess[]
    selectedWorkspace?: WorkspaceWithAccess
}) {
    if (workspaces.length === 0) return null
    const savedId = initialSelectedWorkspace?.id
    const initialWorkspace =
        workspaces.find((w) => w.id === savedId) ?? workspaces[0]

    return (
        <WorkspaceSwitcherClient
            workspaces={workspaces}
            initialWorkspace={initialWorkspace}
        />
    )
}
