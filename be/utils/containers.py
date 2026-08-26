import docker
from utils.error import AppError

client = docker.from_env() 

def create_container(repo_path:str,api_key:str):
    try:
        container = client.containers.create(
            image="agent-server",
            name="agent-server-container",
            environment={
                "DEEPSEEK_API_KEY":api_key
            },      
            volumes={
            repo_path: {"bind": "/workspace", "mode": "rw"}
            },
            ports={"8000/tcp": 8001},
            detach=True,
        )
        container.start()
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
