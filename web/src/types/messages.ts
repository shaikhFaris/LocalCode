export type Messages = {
  id: string;
  workspace_id: string;
  role: "user" | "assistent" | "tool" | "system";
  content: string;
  sequence: string;
  created_at: string;
};
