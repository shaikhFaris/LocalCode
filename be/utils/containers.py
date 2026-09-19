import docker
import os
from utils.error import AppError
from dotenv import load_dotenv

load_dotenv()
client = docker.from_env() 

def create_container(repo_path: str, api_key: str, workspace_id: str):
    try:
        container = client.containers.create(
            image="agent-server",
            name="agent-server-container",
            environment={
                "DEEPSEEK_API_KEY":api_key,
                "WORKSPACE_ID":workspace_id,
                "DATABASE_URL":"postgresql+asyncpg://postgres:pass123@localcode-db:5432/postgres",
            },      
            volumes={
            repo_path: {"bind": "/workspace", "mode": "rw"}
            },
            network="coding-agent_localcode-network",
            ports={"8000/tcp": 8001},
            detach=True,
        )
        container.start()
        print("container created")
        print(container.status)
    except Exception as e:
        raise AppError(
            status_code=500,
            message="Could not create agent container",
            details="Error while creating agent container to run wworkspace"+str(e)
        )

# def delete_container(workspace_id):
#     try:
#         container = client.containers.create(
#             image="agent-server",
#             name="agent-server-container",
#             environment={
#                 "DEEPSEEK_API_KEY":api_key
#             },      
#             volumes={
#             repo_path: {"bind": "/workspace", "mode": "rw"}
#             },
#             ports={"8000/tcp": 8001},
#             detach=True,
#         )
#         container.start()
#         print(container.status)
#     except Exception as e:
#         raise AppError(
#             status_code=500,
#             message="Could not create agent container",
#             details="Error while creating agent container to run wworkspace"+str(e)
#         )
