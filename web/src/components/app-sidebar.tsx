import * as React from "react";
import { Link, useLocation } from "react-router";
import { FolderGit2, Loader2, Plus } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { Workspace } from "@/types/workspace";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;

    fetch(`${API_BASE_URL}/workspaces`)
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load workspaces");
        return response.json() as Promise<{ data?: Workspace[] }>;
      })
      .then((payload) => {
        if (active) setWorkspaces(payload.data ?? []);
      })
      .catch(() => {
        if (active) setWorkspaces([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [location.pathname]);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div>
            <h2 className="font-semibold">LocalCode</h2>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={location.pathname === "/workspace/new"}
              render={<Link to="/workspace/new" />}
            >
              <Plus />
              <span>New workspace</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <FolderGit2 />
            <p>Created workspaces</p>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {loading && (
                <SidebarMenuItem>
                  <SidebarMenuButton disabled>
                    <Loader2 className="animate-spin" />
                    Loading workspaces
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {!loading && workspaces.length === 0 && (
                <p className="px-2 py-3 text-xs text-sidebar-foreground/60">
                  No workspaces yet.
                </p>
              )}
              {workspaces.map((workspace) => (
                <SidebarMenuItem key={workspace.id}>
                  <SidebarMenuButton
                    isActive={location.pathname === `/workspace/${workspace.id}`}
                    render={<Link to={`/workspace/${workspace.id}`} />}
                    tooltip={workspace.id}
                  >
                    <span
                      aria-label={`Container ${workspace.status}`}
                      className={`size-2 rounded-full ${
                        workspace.status === "running"
                          ? "bg-emerald-500"
                          : workspace.status === "stopped"
                            ? "bg-muted-foreground"
                            : "bg-red-500"
                      }`}
                    />
                    <span>{`Workspace ${workspace.id.slice(0, 8)}`}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
