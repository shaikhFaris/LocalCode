import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageAvatar, MessageContent } from "@/components/ui/message";
import { Button } from "@/components/ui/button";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AgentOutput = {
  type: "agent_output";
  payload: string;
};

const Workspace = () => {
  const { id: workspaceId } = useParams();
  const socketRef = useRef<WebSocket | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const submitFormRef = useRef<HTMLFormElement>(null);

  const submitMessage = (event: React.SubmitEvent) => {
    event.preventDefault();
    const userQuery = input.trim();

    if (!userQuery || !socketRef.current) {
      console.log("couldnot send message");
      console.log(socketRef.current);

      return;
    }
    if (socketRef.current.readyState !== WebSocket.OPEN) {
      console.log("WebSocket is not connected");
      console.log("readyState:", socketRef.current.readyState);
      return;
    }

    setMessages((current) => [...current, { role: "user", content: userQuery }]);
    socketRef.current.send(
      JSON.stringify({
        type: "user_chat",
        payload: { user_query: userQuery },
      }),
    );
    setInput("");
  };

  const handleEnter = (e: KeyboardEvent) => {
    if (e.code === "Enter" && e.ctrlKey && submitFormRef.current) {
      e.preventDefault();
      submitFormRef.current.requestSubmit();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleEnter);
    return () => window.removeEventListener("keydown", handleEnter);
  }, []);

  useEffect(() => {
    if (!workspaceId) return;

    const socket = new WebSocket(`ws://localhost:8001/workspace/${workspaceId}`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connected");
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as AgentOutput;

      if (message.type === "agent_output") {
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: message.payload,
          },
        ]);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = (event) => {
      console.log("WebSocket disconnected");
      console.log("code:", event.code);
      console.log("reason:", event.reason);
      console.log("clean:", event.wasClean);

      socketRef.current = null;
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [workspaceId]);

  if (!workspaceId) {
    return <div>invalid params</div>;
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col gap-6 p-6">
      <section className="flex-1 space-y-4">
        {messages.map((message, index) => {
          const isUser = message.role === "user";

          return (
            <Message key={`${message.role}-${index}`} align={isUser ? "end" : "start"}>
              <MessageAvatar>
                <Avatar>
                  <AvatarFallback>{isUser ? "You" : "AI"}</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <Bubble
                  align={isUser ? "end" : "start"}
                  variant={isUser ? "default" : "secondary"}
                >
                  <BubbleContent>{message.content}</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          );
        })}
      </section>

      <form className="flex h-10" ref={submitFormRef} onSubmit={submitMessage}>
        <textarea
          className="h-10 flex-1 resize-none rounded-lg border bg-secondary px-3 py-2 text-sm outline-none"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about your workspace..."
          rows={1}
        />
        <Button type="submit" disabled={!input.trim()} className={"h-full"}>
          Send
        </Button>
      </form>
    </main>
  );
};

export default Workspace;
