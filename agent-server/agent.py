from langchain.messages import AnyMessage
import os
from typing_extensions import TypedDict, Annotated
import operator
from langchain.messages import SystemMessage,HumanMessage,ToolMessage
from typing import Literal
from langgraph.graph import StateGraph, START, END
from agent_tools.tools import tools_by_name,model_with_tools
from prompts.coding_agent import CODING_AGENT_SYSTEM_PROMPT

class MessagesState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    llm_calls: int
    total_tokens: int


def llm_call(state: MessagesState):
    """LLM decides whether to call a tool or not"""

    response=model_with_tools.invoke([SystemMessage(content=CODING_AGENT_SYSTEM_PROMPT)]+ state["messages"])
    tokens_used = response.usage_metadata.get("total_tokens", 0) if response.usage_metadata else 0
    return {
        "messages": [response],
        "llm_calls": state.get('llm_calls', 0) + 1,
        "total_tokens": state.get("total_tokens", 0) + tokens_used
    }

def tool_node(state: MessagesState):
    """Performs the tool call"""

    result = []
    for tool_call in state["messages"][-1].tool_calls:
        tool = tools_by_name[tool_call["name"]]
        observation = tool.invoke(tool_call["args"])
        result.append(ToolMessage(content=observation, tool_call_id=tool_call["id"]))
    return {"messages": result}

def should_continue(state: MessagesState) -> Literal["tool_node", END]:
    """Decide if we should continue the loop or stop based upon whether the LLM made a tool call"""

    messages = state["messages"]
    last_message = messages[-1]

    # If the LLM makes a tool call, then perform an action
    if last_message.tool_calls:
        return "tool_node"

    # Otherwise, we stop (reply to the user)
    return END


agent_builder = StateGraph(MessagesState)

# Add nodes
agent_builder.add_node("llm_call", llm_call)
agent_builder.add_node("tool_node", tool_node)

# Add edges to connect nodes
agent_builder.add_edge(START, "llm_call")
agent_builder.add_conditional_edges(
    "llm_call",
    should_continue,
    ["tool_node", END]
)
agent_builder.add_edge("tool_node", "llm_call")

# Compile the agent
agent = agent_builder.compile()

# print(agent.get_graph(xray=True).draw_mermaid())
