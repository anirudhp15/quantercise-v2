import {
  createConversation,
  saveMessage,
  getConversationMessages,
} from "./database";
import { StreamChatOptions } from "./types";

export async function streamChat(
  message: string,
  history: any[] = [],
  options: StreamChatOptions
) {
  const encoder = new TextEncoder();

  async function* generate() {
    try {
      console.log("Streaming chat with config:", {
        hasThreadId: !!options.threadId,
        createNewThread: options.createNewThread,
        isAuthenticated: !!options.clerkUser,
        mode: options.mode,
      });

      // Create or get thread ID
      let threadId = options.threadId;
      if (!threadId && options.createNewThread) {
        const title = message.slice(0, 50) + "...";
        const { id, error } = await createConversation(
          options.mode,
          title,
          options.clerkUser
        );

        if (error) {
          // If there's an error, yield it and continue with temporary thread
          yield encoder.encode(
            JSON.stringify({
              type: "error",
              message: `Failed to create conversation, but continuing with temporary thread: ${error}`,
            }) + "\n"
          );
        }

        threadId = id;
        yield encoder.encode(
          JSON.stringify({
            type: "threadId",
            threadId: id,
            temporary: id.startsWith("temp-"),
          }) + "\n"
        );
      }

      // Save user message
      if (threadId) {
        await saveMessage(threadId, {
          role: "user",
          content: message,
        });
      }

      // Generate assistant response
      const response =
        "This is a test response. The actual AI response will be implemented here.";

      // Save assistant message
      if (threadId) {
        await saveMessage(threadId, {
          role: "assistant",
          content: response,
        });
      }

      yield encoder.encode(
        JSON.stringify({
          type: "chat",
          content: response,
        }) + "\n"
      );
    } catch (error) {
      console.error("Error in streamChat:", error);
      yield encoder.encode(
        JSON.stringify({
          type: "error",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        }) + "\n"
      );
    }
  }

  return generate();
}
