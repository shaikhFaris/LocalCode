from fastapi import FastAPI
from fastapi import WebSocketDisconnect,WebSocket
import json
from agent import agent
from langchain.messages import HumanMessage
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

class Payload(BaseModel):
    user_query: str


class Message(BaseModel):
    payload: Payload

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

connections: dict[str, WebSocket] = {}

@app.websocket("/workspace/{workspace_id}")
async def ws_endpoint(websocket: WebSocket, workspace_id: str):
    await websocket.accept()
    print("agent server connected via ws")
    # register this connection somewhere (dict keyed by job_id)
    connections[workspace_id] = websocket
    try:
        while True:
            raw = await websocket.receive_text()  # keep alive
            message = json.loads(raw)
            match message.get("type"):
                case "user_chat":
                    message = Message.model_validate(message)
                    messages = [HumanMessage(content=message.payload.user_query)]
                    start=True
                    async for message_chunk, metadata in agent.astream({"messages": messages}, stream_mode="messages"):
                        if not message_chunk.content:
                            continue
                        if metadata.get("langgraph_node") != "llm_call":
                            print(message_chunk.content)
                            continue
                        await websocket.send_json({"type": "agent_output", "payload": {
                            "start":start,
                            "content":message_chunk.content
                        }})
                        start=False

                case _:
                    print(f"Unknown message type: {message.get('type')}")
    except WebSocketDisconnect:
        connections.pop(workspace_id, None)

