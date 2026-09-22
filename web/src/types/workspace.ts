export type Workspace = {
  id: string;
  created_at: string;
  updated_at: string;
  status: "running" | "stopped" | "deleted";
};
