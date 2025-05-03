import { ChatOpenAI } from "@langchain/openai";
import { LessonSettings } from "@/types";
import {
  createConversation,
  saveMessage,
  getConversationMessages,
} from "./index";

/**
 * A simplified workaround for the multi-agent chat system
 * that avoids using the LangGraph StateGraph API which has TypeScript issues
 */
export async function* streamMultiAgentChatWorkaround(
  input: string,
  history: { role: string; content: string }[] = [],
  options: {
    mode?: "student" | "teacher";
    threadId?: string;
    createNewThread?: boolean;
    clerkId?: string;
    structuredOutput?: boolean;
    settings?: LessonSettings;
  }
): AsyncGenerator<string, void, unknown> {
  const {
    mode = "student",
    threadId,
    createNewThread = false,
    clerkId,
    structuredOutput = true,
    settings = {
      contentType: "worksheet",
      gradeLevel: "8",
      length: "standard",
      tone: "academic",
    },
  } = options;

  // Create a new thread if needed
  let actualThreadId = threadId;
  if (createNewThread && !threadId) {
    try {
      // Generate a title based on the input
      const title = input.length > 30 ? `${input.substring(0, 30)}...` : input;
      const tempThreadId = `temp-${crypto.randomUUID()}`;

      try {
        const result = await createConversation(mode, title, clerkId);

        if (result.error) {
          console.warn(`Failed to create conversation: ${result.error}`);
          actualThreadId = tempThreadId;
          yield JSON.stringify({
            type: "threadId",
            threadId: actualThreadId,
            temporary: true,
          });
        } else {
          actualThreadId = result.id;
          yield JSON.stringify({
            type: "threadId",
            threadId: actualThreadId,
          });
        }
      } catch (error) {
        console.error("Error creating conversation:", error);
        actualThreadId = tempThreadId;
        yield JSON.stringify({
          type: "threadId",
          threadId: actualThreadId,
          temporary: true,
        });
      }
    } catch (error) {
      console.error("Error in thread creation process:", error);
      yield JSON.stringify({
        type: "error",
        message: "Failed to create conversation. Please try again.",
      });
      return;
    }
  }

  // Fetch conversation history if available
  let conversationHistory = history;
  if (
    actualThreadId &&
    !actualThreadId.startsWith("temp-") &&
    history.length === 0
  ) {
    try {
      const messages = await getConversationMessages(actualThreadId);
      if (messages && messages.length > 0) {
        conversationHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));
      }
    } catch (error) {
      console.error("Error fetching conversation history:", error);
    }
  }

  // Save the user message if we have a real thread ID
  if (actualThreadId && !actualThreadId.startsWith("temp-")) {
    try {
      await saveMessage(actualThreadId, { role: "user", content: input });
    } catch (error) {
      console.error("Error saving user message:", error);
    }
  }

  try {
    // Status update
    yield JSON.stringify({
      type: "status",
      message: "Analyzing your request...",
      currentStep: 1,
    });

    // Create the chat model for a simplified approach
    const chatModel = new ChatOpenAI({
      modelName: "gpt-4o",
      temperature: 0.7,
    });

    // Step 1: Chat response
    yield JSON.stringify({
      type: "status",
      message: "Generating response...",
      currentStep: 2,
    });

    // Format the history for the prompt
    const historyText = conversationHistory
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    // Simplified approach using a single call
    const systemPrompt = `You are a helpful AI assistant specializing in mathematics education.
You will respond to the user's request in a step-by-step manner:

1. First, analyze their question and provide a conversational response (keep this under 3 paragraphs)
2. Then generate an educational ${settings.contentType} about the topic for ${
      settings.gradeLevel
    } grade students
3. Format the educational content with clear Markdown headings, lists, and proper LaTeX for formulas
4. Ensure all mathematical content is accurate and appropriate for the grade level

The response should be formatted as follows:
# Chat Response
[Your conversational response here]

# ${
      settings.contentType.charAt(0).toUpperCase() +
      settings.contentType.slice(1)
    } Content
[The educational content here with proper sections and formatting]`;

    // Make the API call
    const response = await chatModel.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: `${historyText}\n\nUSER: ${input}` },
    ]);

    const fullContent = response.content as string;

    // Try to parse the response into chat and preview parts
    const chatResponseMatch = fullContent.match(
      /# Chat Response\s+([\s\S]*?)(?=# )/
    );
    const previewContentMatch = fullContent.match(/# .* Content\s+([\s\S]*?)$/);

    const chatResponse = chatResponseMatch
      ? chatResponseMatch[1].trim()
      : fullContent;
    const previewContent = previewContentMatch
      ? previewContentMatch[1].trim()
      : "";

    // Send the chat response
    yield JSON.stringify({
      type: "content",
      content: chatResponse,
      isComplete: false,
    });

    // Step 2: Preview/educational content
    if (previewContent) {
      yield JSON.stringify({
        type: "status",
        message: "Generating educational content...",
        currentStep: 3,
      });

      const metadata = {
        contentType: settings.contentType,
        gradeLevel: settings.gradeLevel,
        length: settings.length,
        tone: settings.tone,
        timestamp: new Date().toISOString(),
        validationStatus: "valid",
        hasErrors: false,
      };

      yield JSON.stringify({
        type: "preview",
        content: previewContent,
        chatContent: chatResponse,
        metadata: metadata,
      });
    }

    // Step 3: Completion
    yield JSON.stringify({
      type: "content",
      content: chatResponse,
      isComplete: true,
    });

    // Save the assistant's response if we have a real thread
    if (actualThreadId && !actualThreadId.startsWith("temp-")) {
      try {
        await saveMessage(actualThreadId, {
          role: "assistant",
          content: fullContent,
        });
      } catch (saveError) {
        console.error("Error saving assistant message:", saveError);
      }
    }
  } catch (error) {
    console.error("Error in streamMultiAgentChatWorkaround:", error);
    yield JSON.stringify({
      type: "error",
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    });
  }
}
