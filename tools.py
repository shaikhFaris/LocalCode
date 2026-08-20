from langchain.tools import tool
import shutil
import subprocess
import os
from langchain.chat_models import init_chat_model
from dotenv import load_dotenv
from datetime import datetime
load_dotenv()

def list_files_recursive(startpath:str, ignore_dirs:set[str]=None, prefix="", _lines=None, _is_root=True):

    if ignore_dirs is None:
        ignore_dirs = {'node_modules', 'venv', '.venv', '__pycache__',
                        '.git', '.idea', '.vscode', 'dist', 'build', 'env'}

    if _lines is None:
        _lines = []

    if _is_root:
        _lines.append(os.path.basename(os.path.normpath(startpath)) + "/")

    try:
        entries = sorted(os.scandir(startpath), key=lambda e: (e.is_file(), e.name.lower()))
    except PermissionError:
        return "\n".join(_lines)

    entries = [e for e in entries if not (e.is_dir() and e.name in ignore_dirs)]

    for i, entry in enumerate(entries):
        is_last = (i == len(entries) - 1)
        connector = "└── " if is_last else "├── "
        _lines.append(prefix + connector + entry.name + ("/" if entry.is_dir() else ""))

        if entry.is_dir():
            extension = "    " if is_last else "│   "
            list_files_recursive(entry.path, ignore_dirs, prefix + extension, _lines, _is_root=False)

    if _is_root:
        return "\n".join(_lines)

@tool
def list_files(startpath:str, ignore_dirs:set[str]=None)->str:
    """
    Build a tree-style directory listing, similar to the Linux `tree` command.

    Args:
        startpath: Root directory path to list.
        ignore_dirs: Set of directory names to skip (e.g. {"node_modules", ".git"}).
            Defaults to a standard set of common build/dependency/VCS folders if None.

    Returns:
        A single string containing the full directory tree, formatted with
        `├──`, `└──`, and `│` connectors, one entry per line.
    """
    return list_files_recursive(startpath,ignore_dirs)

@tool
def read_file(path_and_filename:str)->str:
    """
    Read and return the full contents of a text file.

    Args:
        path_and_filename: Full path (including filename) of the file to read.

    Returns:
        The file's contents as a string.

    Raises:
        FileNotFoundError: If the file does not exist at the given path.
        OSError: If the file cannot be opened or read for other reasons
            (e.g. permission errors, invalid encoding).
    """
    print("reading "+path_and_filename)
    with open(path_and_filename,'r') as f:
        return f.read()

@tool
def search_code(query: str, path: str = None) -> str:
    """
    Search for a whole-word match of `query` within files under `path` using ripgrep.

    Args:
        query: The word or pattern to search for. Matched as a whole word.
        path: File or directory to search within. If a directory is given,
            the search is recursive.

    Returns:
        Ripgrep's formatted match output (grouped by file, with line numbers),
        or a message indicating no matches were found. Returns a prompt
        message instead of searching if `query` or `path` is missing.

    Raises:
        RuntimeError: If ripgrep (`rg`) is not installed / not found on PATH.
    """
    print("searching across in ",path)
    if not query or not path:
        return "Need search query and path to search in"

    rg = shutil.which("rg")
    if not rg:
        raise RuntimeError(
            "ripgrep is required. Install it with your system package manager."
        )

    result = subprocess.run(
        [rg, "--heading", "-n", "-w", "--color=always", query, path],
        capture_output=True,
        text=True,
        encoding="utf-8"
    )

    if result.returncode not in (0, 1):
        raise RuntimeError(f"ripgrep failed: {result.stderr}")

    return result.stdout or "No matches found."

@tool
def git_diff(path_and_filename: str) -> str:
    """
    Get the git diff for a specific file, including untracked (new) files.

    Uses `git add --intent-to-add` internally so that new/untracked files are
    included in the diff output, then reverts that staging so the operation
    stays read-only (no lasting changes to git's index).

    Args:
        path_and_filename: Path to the file to diff.

    Returns:
        The diff output as a string, or a message indicating no changes were
        made. Returns a prompt message instead of running if the path is missing.

    Raises:
        RuntimeError: If git is not installed / not found on PATH.
        subprocess.CalledProcessError: If the underlying git commands fail.
    """
    print("git diffing in ",path_and_filename)
    if not path_and_filename:
        return "Need path with filename to get git diff"
    
    git = shutil.which("git")
    if not git:
        raise RuntimeError(
            "git is required. Install it with your system package manager."
        )

    subprocess.run(
        [git, "add","-N",path_and_filename],
        check=True
    )
    result = subprocess.run(
        [git, "diff",path_and_filename],
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True
    )
    return result.stdout or "No changes made."

@tool
def git_status()->str:
    """
    Get the current git status of the repository.

    Returns:
        The output of `git status`, showing staged, unstaged, and untracked
        changes.

    Raises:
        RuntimeError: If git is not installed / not found on PATH.
        subprocess.CalledProcessError: If the underlying git command fails.
    """
    print("git status")

    git = shutil.which("git")
    if not git:
        raise RuntimeError(
            "git is required. Install it with your system package manager."
        )

    result= subprocess.run(
        [git, "status"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True
    )
    return result.stdout or "No changes made."

model = init_chat_model(
    "deepseek-v4-flash",
    model_provider="deepseek"   
)

tools=[list_files,read_file,search_code,git_diff,git_status]
tools_by_name = {tool.name: tool for tool in tools}

model_with_tools=model.bind_tools(tools)