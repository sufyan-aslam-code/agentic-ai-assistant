"""LangGraph agent for tool routing."""
import operator
from typing import Annotated, TypedDict

from langchain_core.messages import BaseMessage, ToolMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, START, END
from pydantic import BaseModel, Field
from langchain_tavily import TavilySearch

from rag import retrieve_context

# ---------------------------------------------------------------------------
# State & Schemas
# ---------------------------------------------------------------------------

class AgentState(TypedDict):
    """The state of our graph."""
    messages: Annotated[list[BaseMessage], operator.add]
    sources: Annotated[list[dict], operator.add]


class RetrieveTool(BaseModel):
    """Search the document database for relevant context."""
    query: str = Field(description="The semantic search query.")
    filename_filter: str | None = Field(default=None, description="Optional filename to filter by.")


# ---------------------------------------------------------------------------
# Nodes & Logic
# ---------------------------------------------------------------------------

# Initialize LLM with the tool bound
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")
tavily_tool = TavilySearch(max_results=3)
llm_with_tools = llm.bind_tools([RetrieveTool, tavily_tool])


def chatbot(state: AgentState):
    """The main LLM node."""
    system_prompt = SystemMessage(
        content="""You are an Information Retrieval and Research Assistant. You have two tools at your disposal:
1. RetrieveTool: Use this tool to search internal uploaded documents (PDFs, text files, etc.). Use this if the user asks about their files or specific uploaded content.
2. tavily_search: Use this tool to search the internet for real-time facts, current events, or general world knowledge. Use this if the user asks about something outside of your training data or specifically requests web search.

STRICT ROLE LIMITATION:
You are exclusively an Information Retrieval and Research Assistant. You MUST NOT generate, write, debug, or refactor code under any circumstances.
If a user asks you to write code, solve programming exercises, or produce implementation scripts, you MUST decline and state exactly:
"I am designed strictly for search and retrieval across your uploaded documents and the live web. I cannot write or debug code. Let me know if you need help finding documentation, research, or real-time information instead."

SEARCH EXCEPTION:
You are allowed to cite or summarize code snippets ONLY if they are directly found within the retrieved context (e.g., from an indexed technical document or a searched documentation URL)."""
    )
    
    messages = state["messages"]
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [system_prompt] + messages
        
    response = llm_with_tools.invoke(messages)
    return {"messages": [response]}


def tool_node(state: AgentState):
    """Execute the retrieval tool and update sources."""
    last_message = state["messages"][-1]
    
    new_messages = []
    new_sources = []
    
    for tool_call in last_message.tool_calls:
        if tool_call["name"] == "RetrieveTool":
            query = tool_call["args"].get("query")
            filename_filter = tool_call["args"].get("filename_filter")
            
            # Execute retrieval
            contexts = retrieve_context(query, filename_filter=filename_filter)
            
            # Add to sources state tracking
            new_sources.extend(contexts)
            
            # Format context for the LLM
            context_texts = []
            for ctx in contexts:
                context_texts.append(f"[Source: {ctx['filename']} - Page {ctx['page']}]\n{ctx['text']}\n---")
            
            
            context_str = "\n\n".join(context_texts) if context_texts else "No relevant context found."
            
            # Create ToolMessage
            new_messages.append(
                ToolMessage(
                    content=context_str,
                    tool_call_id=tool_call["id"],
                )
            )
        elif tool_call["name"] == "tavily_search":
            query = tool_call["args"].get("query")
            
            # Execute search
            raw_results = tavily_tool.invoke({"query": query})
            results = raw_results.get("results", []) if isinstance(raw_results, dict) else raw_results
            
            # Format context for the LLM and add to sources
            context_texts = []
            for res in results:
                new_sources.append({
                    "filename": f"Web: {res.get('url', 'Unknown')}",
                    "page": "N/A",
                    "text": res.get('content', '')
                })
                context_texts.append(f"[Source: {res.get('url')}]\n{res.get('content')}\n---")
                
            context_str = "\n\n".join(context_texts) if context_texts else "No results found on the web."
            
            # Create ToolMessage
            new_messages.append(
                ToolMessage(
                    content=context_str,
                    tool_call_id=tool_call["id"],
                )
            )
            
    return {"messages": new_messages, "sources": new_sources}


def route_tools(state: AgentState):
    """Route to tool_node if tool calls exist, else END."""
    last_message = state["messages"][-1]
    if hasattr(last_message, "tool_calls") and last_message.tool_calls:
        return "tools"
    return END

# ---------------------------------------------------------------------------
# Graph Compilation
# ---------------------------------------------------------------------------

graph_builder = StateGraph(AgentState)

graph_builder.add_node("chatbot", chatbot)
graph_builder.add_node("tools", tool_node)

graph_builder.add_edge(START, "chatbot")
graph_builder.add_conditional_edges("chatbot", route_tools, {"tools": "tools", END: END})
graph_builder.add_edge("tools", "chatbot")

app_graph = graph_builder.compile()
