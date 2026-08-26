from fastapi import FastAPI
from fastapi import WebSocketDisconnect,WebSocket
import json
from agent import agent
from langchain.messages import HumanMessage
from pydantic import BaseModel


class Payload(BaseModel):
    user_query: str


class Message(BaseModel):
    payload: Payload

app = FastAPI()

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
                    messages = agent.invoke({"messages": messages})
                    for m in messages["messages"]:
                        m.pretty_print()
                    print("================================== END ==================================")
                    print(f"Total tokens used: {messages['total_tokens']}")
                    print(f"Total LLM calls: {messages['llm_calls']}")
                    await websocket.send_json({"type": "agent_output", "payload": messages["messages"][-1].content})
                case _:
                    print(f"Unknown message type: {message.get('type')}")
    except WebSocketDisconnect:
        connections.pop(workspace_id, None)

