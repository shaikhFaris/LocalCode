import { useState } from "react";
import { useNavigate } from "react-router";
import { FolderGit2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
type CreationMode = "local" | "github";

function NewWorkspace() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CreationMode>("local");
  const [repoPath, setRepoPath] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function createWorkspace(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const endpoint =
        mode === "local"
          ? `${API_BASE_URL}/workspace/create/import?repo_path=${encodeURIComponent(repoPath)}`
          : `${API_BASE_URL}/workspace/create/github`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: mode === "github" ? { "Content-Type": "application/json" } : undefined,
        body: mode === "github" ? JSON.stringify({ repo_url: repoUrl }) : undefined,
      });
      const payload = (await response.json()) as {
        data?: { workspace_id?: string };
        message?: string;
      };

      if (!response.ok || !payload.data?.workspace_id) {
        throw new Error(payload.message ?? "Could not create workspace");
      }

      navigate(`/workspace/${payload.data.workspace_id}`);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Could not create workspace",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const hasSource = mode === "local" ? repoPath.trim() : repoUrl.trim();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col gap-8 p-6 md:p-10">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Workspace setup
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Create a new workspace</h1>
        <p className="max-w-xl text-muted-foreground">
          Bring a project into LocalCode from a folder on this machine or a GitHub
          repository.
        </p>
      </header>

      <form className="space-y-6" onSubmit={createWorkspace}>
        <div className="grid gap-4 md:grid-cols-2">
          <button
            type="button"
            className={`flex min-h-36 flex-col items-start gap-3 rounded-xl border p-5 text-left transition-colors ${mode === "local" ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
            onClick={() => setMode("local")}
            aria-pressed={mode === "local"}
          >
            <FolderGit2 className="size-5 text-primary" />
            <span className="font-medium">Import from local</span>
            <span className="text-sm text-muted-foreground">
              Use an existing repository directory on this machine.
            </span>
          </button>
          <button
            type="button"
            className={`flex min-h-36 flex-col items-start gap-3 rounded-xl border p-5 text-left transition-colors ${mode === "github" ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
            onClick={() => setMode("github")}
            aria-pressed={mode === "github"}
          >
            {/* <Github className="size-5 text-primary" /> */}
            <span className="font-medium">Clone from GitHub</span>
            <span className="text-sm text-muted-foreground">
              Clone a public repository into a managed workspace.
            </span>
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "local" ? "Repository folder" : "GitHub repository"}
            </CardTitle>
            <CardDescription>
              {mode === "local"
                ? "Enter the absolute path to the repository folder."
                : "Paste the HTTPS or SSH URL of a public GitHub repository."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="repository-source">
                {mode === "local" ? "Local path" : "Repository URL"}
              </Label>
              <Input
                id="repository-source"
                value={mode === "local" ? repoPath : repoUrl}
                onChange={(event) =>
                  mode === "local"
                    ? setRepoPath(event.target.value)
                    : setRepoUrl(event.target.value)
                }
                placeholder={
                  mode === "local"
                    ? "D:\\projects\\my-app"
                    : "https://github.com/org/repository.git"
                }
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={!hasSource || submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {submitting ? "Creating workspace..." : "Create workspace"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </main>
  );
}

export default NewWorkspace;
