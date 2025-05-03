import { ChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
  PromptTemplate,
} from "@langchain/core/prompts";
import {
  StringOutputParser,
  JsonOutputParser,
} from "@langchain/core/output_parsers";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { RunnableSequence, RunnableLambda } from "@langchain/core/runnables";
import { StateGraph, END } from "@langchain/langgraph";
import { getValidatorPrompt } from "./prompts";
import { LessonSettings } from "@/types";
import {
  saveMessage,
  getConversationMessages,
  createConversation,
} from "./index";

// Create Supabase client
const createSupabaseClient = (): SupabaseClient => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

// Define the LangGraph state interface
interface MultiAgentState {
  messages: BaseMessage[];
  threadId?: string;
  clerkId?: string;
  mode: "student" | "teacher";
  settings: LessonSettings;
  userInput: string;
  chatOutput?: string;
  retrievedContext?: string[];
  previewContent?: string;
  validationResult?: {
    status: "valid" | "errors_found" | "validation_error";
    errors?: Array<{
      error_detail: string;
      location?: string;
      correction?: string;
    }>;
    suggestions?: string[];
  };
  finalOutput?: string;
  error?: string;
}

// System prompts for our agents
const CHAT_AGENT_PROMPT = `You are a helpful AI assistant specialized in mathematics education. Your role is to understand the user's request and identify their core needs.

TASK:
1. Carefully analyze the user's message
2. Identify the key mathematical topic they're asking about
3. Determine what type of educational content they need (worksheet, explanations, lesson, etc.)
4. Extract any specific requirements mentioned (grade level, complexity, etc.)

Respond in a conversational and helpful tone, briefly acknowledging the request. Keep your response under 100 words, focused on confirming the key details. 

Don't actually create the content - other agents will do that. Focus only on understanding and interpreting the request clearly.`;

const RETRIEVER_AGENT_PROMPT = `You are a knowledgeable context retriever for mathematics education. Your purpose is to identify and retrieve relevant mathematical knowledge needed to address the user's request.

Based on the user's query and the chat agent's interpretation, identify the most important mathematical concepts, formulas, definitions, and examples that would be useful for generating appropriate educational content.

Respond with a structured list of relevant mathematical knowledge, including:
1. Core mathematical concepts related to the query
2. Important formulas and equations (using LaTeX notation)
3. Key definitions
4. Typical examples or problem types
5. Common misconceptions or challenging aspects
6. Grade-level appropriate language and complexity considerations

Format your response as a series of short, clear sections with headers in Markdown.`;

const PREVIEW_AGENT_PROMPT = `You are a skilled educational content creator specialized in mathematics. Your task is to create high-quality math educational content based on the user's request, incorporating relevant mathematical context.

Create detailed, structured content that meets the specific requirements outlined in the user's request and chat agent's interpretation. Utilize the mathematical context provided by the retriever agent.

Your content should:
1. Be appropriate for the specified grade level and audience
2. Include proper mathematical notation (using LaTeX for formulas)
3. Follow best practices for educational content design
4. Be organized with clear headings, sections, and progression
5. Include appropriate examples, problems, and solutions

Format the entire response in Markdown, using proper heading levels, lists, tables, and emphasis as appropriate.

Remember, this is a preview of what will be created, so make it comprehensive and high-quality.`;

const VALIDATION_AGENT_PROMPT = `You are a mathematics expert responsible for validating educational content. Your role is to meticulously review math content for accuracy, appropriateness, and effectiveness.

Review the generated preview content and assess it based on the following criteria:
1. Mathematical accuracy: Are all formulas, definitions, and solutions correct?
2. Appropriateness for grade level: Is the complexity suitable for the intended audience?
3. Clarity of explanations: Are concepts explained clearly and logically?
4. Quality of examples: Are examples relevant, diverse, and helpful?
5. Proper notation: Is mathematical notation used correctly?

Respond with a JSON object using this exact format:
{
  "status": "valid" | "errors_found" | "validation_error",
  "errors": [
    {
      "error_detail": "Description of the error",
      "location": "Where the error occurs (e.g., 'Example 2', 'Formula in section 3')",
      "correction": "Suggested correction"
    }
  ],
  "suggestions": ["Suggestion for improvement 1", "Suggestion 2"]
}

If there are no errors, return an empty array for "errors". If there are no suggestions, return an empty array for "suggestions".`;

// Create models for each agent with appropriate settings
const createChatAgentModel = () => {
  return new ChatOpenAI({
    modelName: "gpt-3.5-turbo-0125",
    temperature: 0.7,
    streaming: true,
  });
};

const createRetrieverAgentModel = () => {
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.3,
    streaming: true,
  });
};

const createPreviewAgentModel = () => {
  return new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0.6,
    streaming: true,
  });
};

const createValidationAgentModel = () => {
  return new ChatOpenAI({
    modelName: "gpt-4", // Using GPT-4 for highest accuracy in math validation
    temperature: 0,
    streaming: false,
  });
};

// Function to convert messages to LangChain format
const convertToLangChainMessages = (
  messages: { role: string; content: string }[]
) => {
  return messages.map((message) => {
    if (message.role === "user") {
      return new HumanMessage(message.content);
    } else if (message.role === "assistant") {
      return new AIMessage(message.content);
    } else {
      return new SystemMessage(message.content);
    }
  });
};

// Agent implementations
export const chatAgent = RunnableLambda.from(async function* (
  state: MultiAgentState
): AsyncGenerator<any, Partial<MultiAgentState>, void> {
  yield {
    type: "status",
    currentStep: 0,
    message: "Analyzing your request...",
  };

  const chatModel = createChatAgentModel();
  const historyMessages = state.messages;
  const latestUserMessage = state.userInput;

  const chatPrompt = ChatPromptTemplate.fromMessages([
    ["system", CHAT_AGENT_PROMPT],
    ...historyMessages.map((msg) => {
      if (msg._getType && msg._getType() === "human") {
        return ["human", msg.content as string];
      } else {
        return ["ai", msg.content as string];
      }
    }),
    ["human", latestUserMessage],
  ]);

  try {
    const chain = RunnableSequence.from([
      chatPrompt,
      chatModel,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({});

    yield { type: "chat", content: response };

    return {
      chatOutput: response,
    };
  } catch (error) {
    console.error("Error in chat agent:", error);
    yield {
      type: "error",
      message: "Error analyzing your request. Please try again.",
    };
    return {
      error: "Chat agent failed",
    };
  }
});

export const retrieverAgent = RunnableLambda.from(async function* (
  state: MultiAgentState
): AsyncGenerator<any, Partial<MultiAgentState>, void> {
  yield {
    type: "status",
    currentStep: 1,
    message: "Retrieving relevant context...",
  };

  const retrieverModel = createRetrieverAgentModel();
  const userInput = state.userInput;
  const chatOutput = state.chatOutput;

  // Here you would typically query your Supabase vector database
  // For now, we'll simulate the retrieval with the model
  const contextPrompt = ChatPromptTemplate.fromMessages([
    ["system", RETRIEVER_AGENT_PROMPT],
    [
      "human",
      `User request: ${userInput}\n\nChat agent interpretation: ${chatOutput}`,
    ],
  ]);

  try {
    const chain = RunnableSequence.from([
      contextPrompt,
      retrieverModel,
      new StringOutputParser(),
    ]);

    const response = await chain.invoke({});

    yield { type: "context", content: response };

    // In a real implementation, you would parse the retrieved documents
    // Here we're just returning the model's output as context
    return {
      retrievedContext: [response],
    };
  } catch (error) {
    console.error("Error in retriever agent:", error);
    yield {
      type: "status",
      currentStep: 1,
      message:
        "Error retrieving context. Continuing with available information.",
    };
    return {
      retrievedContext: [],
    };
  }
});

export const previewAgent = RunnableLambda.from(async function* (
  state: MultiAgentState
): AsyncGenerator<any, Partial<MultiAgentState>, void> {
  yield {
    type: "status",
    currentStep: 2,
    message: "Generating preview content...",
  };

  const previewModel = createPreviewAgentModel();
  const userInput = state.userInput;
  const chatOutput = state.chatOutput;
  const context =
    state.retrievedContext?.join("\n\n") || "No specific context available.";
  const settings = state.settings;

  const previewPrompt = ChatPromptTemplate.fromMessages([
    ["system", PREVIEW_AGENT_PROMPT],
    [
      "human",
      `User request: ${userInput}
    
    Chat agent interpretation: ${chatOutput}
    
    Mathematical context:
    ${context}
    
    Content settings:
    - Type: ${settings.contentType}
    - Grade level: ${settings.gradeLevel}
    - Length: ${settings.length}
    - Tone: ${settings.tone}
    
    Please generate detailed, well-structured content as a preview.`,
    ],
  ]);

  try {
    const chain = RunnableSequence.from([
      previewPrompt,
      previewModel,
      new StringOutputParser(),
    ]);

    // Since this might be a large response, we don't use streaming chunks here
    // but we could implement a streaming parser if needed
    const response = await chain.invoke({});

    yield { type: "preview_update", presentationContent: response };

    return {
      previewContent: response,
    };
  } catch (error) {
    console.error("Error in preview agent:", error);
    yield {
      type: "error",
      message: "Error generating preview content. Please try again.",
    };
    return {
      error: "Preview agent failed",
    };
  }
});

export const validationAgent = RunnableLambda.from(async function* (
  state: MultiAgentState
): AsyncGenerator<any, Partial<MultiAgentState>, void> {
  yield {
    type: "status",
    currentStep: 3,
    message: "Validating content accuracy...",
  };

  const validationModel = createValidationAgentModel();
  const previewContent = state.previewContent;

  if (!previewContent) {
    yield {
      type: "validation_result",
      validation: {
        status: "validation_error",
        errors: [{ error_detail: "No preview content to validate" }],
        suggestions: [],
      },
    };

    return {
      validationResult: {
        status: "validation_error",
        errors: [{ error_detail: "No preview content to validate" }],
        suggestions: [],
      },
    };
  }

  const validationPrompt = ChatPromptTemplate.fromMessages([
    ["system", VALIDATION_AGENT_PROMPT],
    [
      "human",
      `Please validate the following mathematical educational content:
    
    ${previewContent}`,
    ],
  ]);

  try {
    const chain = RunnableSequence.from([
      validationPrompt,
      validationModel,
      new JsonOutputParser<{
        status: "valid" | "errors_found" | "validation_error";
        errors: Array<{
          error_detail: string;
          location?: string;
          correction?: string;
        }>;
        suggestions: string[];
      }>(),
    ]);

    const validationResult = await chain.invoke({});

    yield { type: "validation_result", validation: validationResult };

    yield { type: "status", currentStep: 4, message: "Finalizing content..." };

    if (
      validationResult.status === "valid" ||
      (validationResult.status === "errors_found" &&
        validationResult.errors.length === 0)
    ) {
      // If validation passed or no actual errors, return the preview as final
      yield {
        type: "chat",
        content:
          "I've created the content you requested! Review the preview for accuracy and completeness.",
      };

      return {
        validationResult,
        finalOutput: previewContent,
      };
    } else if (validationResult.status === "errors_found") {
      // If validation found errors, we should correct them
      // For simplicity, we'll just note the errors for now
      // In a full implementation, you would fix the errors
      const errorSummary = validationResult.errors
        .map(
          (err) =>
            `- ${err.error_detail} (${err.location || "unknown location"})`
        )
        .join("\n");

      yield {
        type: "chat",
        content: `I've created the content, but our verification process found some issues that need attention:\n\n${errorSummary}\n\nPlease review the preview with these points in mind.`,
      };

      return {
        validationResult,
        finalOutput: previewContent,
      };
    } else {
      // Validation error
      yield {
        type: "chat",
        content:
          "I encountered some difficulties validating the mathematical content. Please review the preview carefully.",
      };

      return {
        validationResult,
        finalOutput: previewContent,
      };
    }
  } catch (error) {
    console.error("Error in validation agent:", error);
    yield {
      type: "validation_result",
      validation: {
        status: "validation_error",
        errors: [{ error_detail: "Validation process failed" }],
        suggestions: [],
      },
    };

    yield {
      type: "chat",
      content:
        "I encountered difficulties validating the mathematical content. Please review the preview carefully.",
    };

    return {
      validationResult: {
        status: "validation_error",
        errors: [{ error_detail: "Validation process failed" }],
        suggestions: [],
      },
      finalOutput: previewContent,
    };
  }
});

// Build the LangGraph workflow
export const createMultiAgentGraph = () => {
  // In the JS version, we need to define state differently
  const workflow = new StateGraph({
    channels: {
      messages: [],
      mode: "student",
      settings: {},
      userInput: "",
    },
  });

  // Define the nodes
  workflow.addNode("chatAgent", chatAgent);
  workflow.addNode("retrieverAgent", retrieverAgent);
  workflow.addNode("previewAgent", previewAgent);
  workflow.addNode("validationAgent", validationAgent);

  // Define the edges with proper start nodes (in JS version we need to specify __start__)
  workflow.addEdge("__start__", "chatAgent");
  workflow.addEdge("chatAgent", "retrieverAgent");
  workflow.addEdge("retrieverAgent", "previewAgent");
  workflow.addEdge("previewAgent", "validationAgent");
  workflow.addEdge("validationAgent", END);

  // Compile the graph
  return workflow.compile();
};

// Function to stream chat from the multi-agent system
export async function* streamMultiAgentChat(
  input: string,
  history: { role: string; content: string }[] = [],
  options: {
    mode: "student" | "teacher";
    threadId?: string;
    createNewThread?: boolean;
    clerkId?: string;
    structuredOutput?: boolean;
    settings?: LessonSettings;
    useV1Fallback?: boolean;
  }
) {
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
    useV1Fallback = false,
  } = options;

  let actualThreadId = threadId;

  // Create a new thread if needed
  if (createNewThread && !threadId) {
    try {
      // Generate a title based on the input
      const title = input.length > 30 ? `${input.substring(0, 30)}...` : input;

      // Create a temporary thread ID to use if creation fails
      const tempThreadId = `temp-${crypto.randomUUID()}`;

      try {
        const result = await createConversation(mode, title, clerkId);

        if (result.error) {
          console.warn(`Failed to create conversation: ${result.error}`);
          // Use temporary thread ID but continue processing
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
        // Use temporary thread ID but continue processing
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
        message:
          "Failed to create conversation, but continuing with processing",
      });
      // Continue without a thread ID - we'll just handle the conversation in memory
    }
  }

  // Save the user message - only if we have a real thread ID, not a temporary one
  if (actualThreadId && !actualThreadId.startsWith("temp-")) {
    try {
      await saveMessage(actualThreadId, { role: "user", content: input });
    } catch (error) {
      console.error("Error saving user message:", error);
      // Continue anyway - we'll try to process the message
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
      // Continue with empty history if we can't fetch it
    }
  }

  // Initial state for the graph
  const initialState: MultiAgentState = {
    messages: convertToLangChainMessages(conversationHistory),
    threadId: actualThreadId,
    clerkId,
    mode,
    settings,
    userInput: input,
  };

  try {
    // Create the workflow graph
    const multiAgentGraph = createMultiAgentGraph();

    // Execute the graph and stream results
    const stream = await multiAgentGraph.stream(initialState);

    for await (const output of stream) {
      const nodeOutput = output.result;

      // Send any agent outputs
      for (const chunk of output.chunks || []) {
        if (structuredOutput) {
          yield JSON.stringify(chunk);
        } else {
          // For compatibility with older clients that expect simple text
          if (chunk.type === "chat" && chunk.content) {
            yield chunk.content;
          }
        }
      }
    }

    // Save the final assistant message if available - only for real thread IDs
    if (
      actualThreadId &&
      !actualThreadId.startsWith("temp-") &&
      initialState.finalOutput
    ) {
      try {
        await saveMessage(actualThreadId, {
          role: "assistant",
          content: initialState.finalOutput,
        });
      } catch (error) {
        console.error("Error saving assistant message:", error);
      }
    }
  } catch (error) {
    console.error("Error in streamMultiAgentChat:", error);

    if (useV1Fallback) {
      yield JSON.stringify({
        type: "status",
        message: "Falling back to v1 endpoint due to error...",
      });

      // Import v1 streamChat but avoid import cycle
      const { streamChat } = await import("./index");

      for await (const chunk of streamChat(input, conversationHistory, {
        mode,
        threadId:
          actualThreadId && !actualThreadId.startsWith("temp-")
            ? actualThreadId
            : undefined,
        clerkId,
        structuredOutput,
        settings,
      })) {
        yield chunk;
      }
    } else {
      yield JSON.stringify({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unknown error in multi-agent stream",
      });
    }
  }
}
