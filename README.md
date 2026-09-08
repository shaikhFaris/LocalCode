# LocalCode

[LocalCode](https://github.com/shaikhFaris/LocalCode) is a local coding-agent product (early MVP). It runs a coding agent against your projects on your machine, with a web UI, a backend that manages Docker workspaces, and an agent service that streams responses over WebSockets.

## Repository layout

| Package | Role |
| --- | --- |
| `web/` | React + Vite frontend for chatting with the agent and working in a workspace |
| `be/` | FastAPI backend that creates and manages Docker workspace containers |
| `agent-server/` | FastAPI + LangChain/LangGraph agent with WebSocket streaming |

## Links

- GitHub: https://github.com/shaikhFaris/LocalCode
