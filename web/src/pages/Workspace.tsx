import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import { Button } from "@/components/ui/button";
import { useSandbox } from "@/hooks/useSandBox";
import { StreamingText } from "@/components/StreamingText";
// import Markdown from "react-markdown";
import { cn } from "@/lib/utils";
import type { Messages } from "@/types/messages";
import type { Workspace } from "@/types/workspace";
import { Spinner } from "@/components/ui/spinner";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AgentOutput = {
  type: "agent_output";
  payload: {
    start: boolean;
    content: string;
  };
};
const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const Workspace = () => {
  const { id: workspaceId } = useParams();
  const socketRef = useRef<WebSocket | null>(null);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const submitFormRef = useRef<HTMLFormElement>(null);
  const { setSandboxConnected } = useSandbox();
  const [status, setStatus] = useState<Workspace["status"] | null>(null);
  const [isContainerStarting, setIsContainerStarting] = useState(false);

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

    let cancelled = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectDelay = 500;

    const connect = () => {
      if (cancelled) return;

      const socket = new WebSocket(`ws://localhost:8001/workspace/${workspaceId}`);

      socketRef.current = socket;

      console.log("connecting to workspace:", workspaceId);

      socket.onopen = () => {
        if (cancelled) {
          socket.close();
          return;
        }
        reconnectDelay *= 2;

        console.log("WebSocket connected:", workspaceId);
        setSandboxConnected(true);
      };

      socket.onmessage = (event) => {
        if (cancelled) return;

        const message = JSON.parse(event.data) as AgentOutput;

        if (message.type === "agent_output") {
          if (message.payload.start) {
            setMessages((prev) => [
              ...prev,
              {
                role: "assistant",
                content: message.payload.content,
              },
            ]);
          } else {
            setMessages((prev) => {
              if (prev.length === 0) return prev;

              const last = prev[prev.length - 1];

              return [
                ...prev.slice(0, -1),
                {
                  ...last,
                  content: last.content + (message.payload.content ?? ""),
                },
              ];
            });
          }
        }
      };

      socket.onerror = (error) => {
        if (cancelled) return;

        console.error("WebSocket error:", error);
        setSandboxConnected(false);
      };

      socket.onclose = () => {
        if (cancelled) return;

        console.log(`WS closed for ${workspaceId}. Reconnecting in ${reconnectDelay}ms`);

        setSandboxConnected(false);

        reconnectTimer = setTimeout(() => {
          if (cancelled) return;

          connect();
        }, reconnectDelay);
      };
    };

    connect();

    return () => {
      console.log("Cleaning up workspace:", workspaceId);

      cancelled = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      setSandboxConnected(false);
    };
  }, [workspaceId, setSandboxConnected]);

  useEffect(() => {
    const fetchMessages = async (): Promise<void> => {
      try {
        const res = await fetch(`${API_BASE_URL}/workspace/${workspaceId}/messages`);
        const data = await (res.json() as Promise<{
          data: Messages[];
          success: boolean;
        }>);
        if (data.success && data.data.length > 0) {
          const messages = data.data.map((el) => {
            return {
              content: el.content,
              role: el.role,
            } as ChatMessage;
          });
          setMessages(messages);
        }
      } catch (error) {
        console.error(error);
      }
    };
    const fetchWorkspace = async (): Promise<void> => {
      try {
        const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}`);
        const data = await (res.json() as Promise<{
          data: Workspace;
          success: boolean;
        }>);
        if (data.success && data.data) {
          console.log(data.data);

          setStatus(data.data.status);
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (!workspaceId) return;
    Promise.allSettled([fetchMessages(), fetchWorkspace()]);
  }, [workspaceId]);

  if (!workspaceId) {
    return <div>invalid params</div>;
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-3xl flex-col gap-6 p-6">
      <section className="flex-1 space-y-4 pb-20">
        {messages.map((message, index) => {
          const isUser = message.role === "user";

          return (
            <Message key={`${message.role}-${index}`} align={isUser ? "end" : "start"}>
              {/* <MessageAvatar>
                <Avatar>
                  <AvatarFallback>{isUser ? "You" : "AI"}</AvatarFallback>
                </Avatar>
              </MessageAvatar> */}
              <MessageContent>
                <Bubble
                  align={isUser ? "end" : "start"}
                  variant={isUser ? "secondary" : "secondary"}
                  className={cn(!isUser && "w-full max-w-full")}
                >
                  {isUser ? (
                    <BubbleContent className="text-base">{message.content}</BubbleContent>
                  ) : (
                    <div className="w-full p-4 markdown">
                      <StreamingText text={message.content} />
                      {/* <Markdown>{message.content}</Markdown> */}
                    </div>
                  )}
                </Bubble>
              </MessageContent>
            </Message>
          );
        })}
      </section>

      <div className="sticky bottom-8 w-full left-0">
        {status === "deleted" && (
          <div>
            <p className="text-sm pl-1">
              Container has been{" "}
              <span className="uppercase text-red-500 font-semibold">{status}</span>
            </p>
          </div>
        )}
        {status === "stopped" && (
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm pl-1">
              Container has been{" "}
              <span className="uppercase text-amber-400 font-semibold">{status}</span>
            </p>
            <Button
              size={"sm"}
              onClick={async () => {
                setIsContainerStarting(true);
                try {
                  const res = await fetch(
                    `${API_BASE_URL}/workspaces/${workspaceId}/start`,
                    {
                      method: "POST",
                    },
                  );
                  const data = await (res.json() as Promise<{
                    success: boolean;
                  }>);
                  if (data.success) setStatus("running");
                } catch (error) {
                  console.log(error);
                } finally {
                  setIsContainerStarting(false);
                }
              }}
            >
              {isContainerStarting ? <Spinner /> : "Start Container"}
            </Button>
          </div>
        )}
        <form
          className="flex h-12 w-full max-w-3xl mx-auto"
          ref={submitFormRef}
          onSubmit={submitMessage}
        >
          <textarea
            className="h-12 flex-1 resize-none rounded-lg border bg-secondary px-3 py-2 outline-none"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your workspace..."
            rows={1}
          />
          <Button
            type="submit"
            disabled={!input.trim() || status !== "running"}
            className={"h-full"}
          >
            Send
          </Button>
        </form>
      </div>
    </main>
  );
};

export default Workspace;
