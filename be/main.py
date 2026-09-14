from fastapi import FastAPI, Request
from utils.error import AppError
from fastapi.responses import JSONResponse
from utils.containers import create_container
from dotenv import load_dotenv
import os
from fastapi.middleware.cors import CORSMiddleware

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

@app.post("/workspace/create/import")
def create_workspace(repo_path:str):
    # check if a workspace is running

    # create a container only if the repo is git initialised
    create_container(api_key=os.getenv("DEEPSEEK_API_KEY"),repo_path=repo_path)

    return {
        "success":True,
        "data":{
        "workspace_id":"dsaoida89d879asd"
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