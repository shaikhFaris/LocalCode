from fastapi import FastAPI, Request
from uuid import UUID
from utils.error import AppError
from fastapi.responses import JSONResponse
from utils.containers import create_container
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware
from database import AsyncSessionLocal
from utils.db.workspace import create_workspace as create_workspace_record
from utils.db.workspace import list_workspaces
from utils.db.message import list_messages

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.get("/workspaces")
async def get_workspaces():
    async with AsyncSessionLocal() as session:
        workspaces = await list_workspaces(session)

    return {
        "success": True,
        "data": [
            {
                "id": str(workspace.id),
                "created_at": workspace.created_at.isoformat(),
                "updated_at": workspace.updated_at.isoformat(),
            }
            for workspace in workspaces
        ],
    }


@app.get("/workspace/{workspace_id}/messages")
async def get_workspace_messages(workspace_id: UUID):
    async with AsyncSessionLocal() as session:
        messages = await list_messages(workspace_id, session)

    return {
        "success": True,
        "data": [
            {
                "id": str(message.id),
                "workspace_id": str(message.workspace_id),
                "role": message.role.value,
                "content": message.content,
                "sequence": message.sequence,
                "created_at": message.created_at.isoformat(),
            }
            for message in messages
        ],
    }

@app.post("/workspace/create/import")
async def create_workspace(repo_path: str):
    # check if a workspace is running

    # transaction
    async with AsyncSessionLocal() as session:
        async with session.begin():
            workspace = await create_workspace_record(session)
            # create a container only if the repo is git initialised
            create_container(
                api_key=os.getenv("DEEPSEEK_API_KEY"),
                repo_path=repo_path,
                workspace_id=str(workspace.id),
            )

    return {
        "success":True,
        "data":{
        "workspace_id":str(workspace.id)
    }}

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    print(exc.message)
    print(exc.details)

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
        },
    )

@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    print(f"Unhandled error: {exc}")

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
        },
    )