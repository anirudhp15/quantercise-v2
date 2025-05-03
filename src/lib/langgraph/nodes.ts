import { ChatOpenAI } from "@langchain/openai";
import { RunnableSequence } from "@langchain/core/runnables";
import { Message, ChatState } from "./types";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
  BaseMessage,
} from "@langchain/core/messages";
import { GraphState, ValidationResult, LessonSettings } from "./state";
import { RunnableLambda } from "@langchain/core/runnables";
import { saveMessage } from "./database";
import {
  JsonOutputParser,
  StringOutputParser,
} from "@langchain/core/output_parsers";

// Create an OpenAI chat model
const createChatModel = () => {
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
    streaming: true,
  });
};

// Convert our messages to LangChain message format
const convertToLangChainMessages = (messages: Message[]) => {
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

// Generate a response from the LLM
export async function generateResponse(state: ChatState): Promise<ChatState> {
  // Get the latest user message
  const latestUserMessage = state.messages
    .filter((msg) => msg.role === "user")
    .pop();

  if (!latestUserMessage) {
    return state;
  }

  // Create the chat model
  const model = createChatModel();

  // Convert messages to LangChain format
  const historyMessages = convertToLangChainMessages(
    state.messages.slice(0, -1) // exclude the latest user message which we'll use as input
  );

  // Create a prompt from the chat history and latest message
  const prompt = getChatPrompt(state.mode);

  // Create a chain
  const chain = RunnableSequence.from([
    prompt,
    model,
    new StringOutputParser(),
  ]);

  // Generate the response
  const response = await chain.invoke({
    history: historyMessages,
    input: latestUserMessage.content,
  });

  // Add the assistant's response to the messages
  return {
    ...state,
    messages: [...state.messages, { role: "assistant", content: response }],
  };
}

// Save messages to database
export async function saveToDatabase(state: ChatState): Promise<ChatState> {
  // This is a placeholder function - would implement actual database saving logic
  // For now, just return the state unchanged
  return state;
}

// --- LLM Configuration ---
// Use a specific model known for chat and instruction following
// Consider GPT-4 Turbo (gpt-4-1106-preview or similar) for better quality
const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini", // Or a more powerful model
  temperature: 0.7,
  streaming: true,
});

// --- Helper Functions ---

// Update the GraphState interface to include settingsComplete
declare module "./state" {
  interface GraphState {
    settingsComplete?: boolean; // Add the settingsComplete flag
  }
}

const createTimeoutPrompt = (
  systemPrompt: string,
  userPrompt: string
): string => {
  return `${systemPrompt}\n\n${userPrompt}`;
};

const createTimeoutPromise = (ms: number, message: string) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
};

// Function to check if all required settings are present
const areSettingsComplete = (settings: Partial<LessonSettings>): boolean => {
  const required: (keyof LessonSettings)[] = [
    "contentType",
    "gradeLevel",
    "length",
    "tone",
    // Add 'topic' if needed, depends on how you extract it from userInput
  ];
  // Ensure the value is not null, undefined, or an empty string
  return required.every((key) => settings[key] != null && settings[key] !== "");
};

// Simple prompting function to replace the missing getChatPrompt
const getChatPrompt = (mode: string) => {
  // This is a stub function to replace the missing import
  return {
    invoke: (params: any) => {
      return `You are a helpful assistant in ${mode} mode. Please respond to: ${params.input}`;
    },
  };
};

// --- Static Prompts (System Instructions) ---
const SETTINGS_CLARIFIER_SYSTEM_PROMPT = `You are an assistant helping a user create educational math content.
Your goal is to gather specific requirements before generating the content.
Required settings are: contentType, gradeLevel, length, tone.

Analyze the latest user message and the conversation history provided.
1. Extract any specified values for the *missing* settings.
2. Determine if all required settings are now filled.
3. If settings are still missing, formulate ONE concise question for the user for the *most important* missing information. Do not ask for info already provided.

Respond ONLY with a JSON object like this:
{
  "updatedSettings": { "contentType": "string|null", "gradeLevel": "string|null", "length": "string|null", "tone": "string|null" },
  "settingsAreComplete": boolean,
  "clarificationQuestion": "string|null"
}`;

const CHAT_RESPONDER_SYSTEM_PROMPT = `You are a helpful math teacher's assistant confirming the details before starting content generation.
Provide a brief, encouraging confirmation (2-3 sentences) that:
1. Confirms you have all the details needed.
2. Briefly restates the confirmed settings.
3. Sets expectations about the generation process starting now.`;

const CONTENT_PLANNER_SYSTEM_PROMPT = `You are a math education expert planning content based on user requirements.
Create a detailed, structured plan (in Markdown) that includes:
1.  **Title and Core Topic:** Derived from the request.
2.  **Learning Objectives:** What students should know or do (2-4 specific objectives).
3.  **Key Concepts:** Main mathematical ideas, definitions, formulas.
4.  **Content Outline:** Step-by-step structure.
5.  **Problem Types:** Kinds of questions/exercises.
6.  **Difficulty Progression:** How difficulty will increase.
7.  **Assessment/Practice:** How learning will be checked.`;

const CONTENT_GENERATOR_SYSTEM_PROMPT = `You are a math teacher creating educational content.
Adhere strictly to the provided content plan.
Generate the complete content as specified in the plan, including title, objectives, concepts, examples, practice problems, and answer key.
Format the entire output in Markdown. Use LaTeX for all mathematical expressions (e.g., $x^2 + y^2 = r^2$, \\frac{a}{b}).
Ensure mathematical accuracy, grade-level appropriateness, and match the required length and tone.`;

const VALIDATOR_SYSTEM_PROMPT = `You are a meticulous mathematics expert validating educational content.
Critically evaluate the provided content based on:
1. Mathematical Accuracy
2. Grade-Level Appropriateness
3. Clarity
4. Completeness
5. Notation (inc. LaTeX)

Respond ONLY with a JSON object like this:
{
  "status": "valid" | "errors_found" | "validation_error",
  "errors": [ { "error_detail": "description", "location": "where", "correction": "fix" } ] | [],
  "suggestions": ["suggestion"] | []
}`;

const REFINER_SYSTEM_PROMPT = `You are a math education expert refining draft content based on validation feedback.
Your Task:
1. Review the validation feedback.
2. Correct ALL identified errors accurately.
3. Incorporate suggestions where feasible.
4. Maintain original structure, tone, grade level, and Markdown formatting (with LaTeX).
5. If validation status was 'validation_error', try to fix obvious issues.

Return ONLY the complete, refined content in Markdown format. Do not add commentary.`;

// --- Node Definitions ---

// New Node: Settings Clarifier
export const settings_clarifier = RunnableLambda.from(async function* (
  state: GraphState
): AsyncGenerator<any, Partial<GraphState>, void> {
  console.log("--- Node: settings_clarifier ---");
  yield { type: "status", message: "Checking requirements..." };

  const currentSettings = { ...state.settings };
  const history = state.messages; // Use the main message history
  const latestUserMessage = history[history.length - 1];

  if (
    !latestUserMessage ||
    (latestUserMessage._getType !== undefined &&
      latestUserMessage._getType() !== "human")
  ) {
    console.error("Settings Clarifier: Last message not from user.");
    yield { type: "error", message: "Internal error: expecting user input." };
    return {};
  }

  // Handle Message from types.ts (with role property) or BaseMessage (with _getType)
  const latestUserInput =
    typeof latestUserMessage.content === "string"
      ? latestUserMessage.content
      : "No message content";

  const requiredSettings: (keyof LessonSettings)[] = [
    "contentType",
    "gradeLevel",
    "length",
    "tone",
  ];
  const missingSettings = requiredSettings.filter(
    (key) => !currentSettings[key] || currentSettings[key] === ""
  );

  if (missingSettings.length === 0 && areSettingsComplete(currentSettings)) {
    console.log("Settings already complete. Skipping clarification.");
    return { settingsComplete: true, settings: currentSettings };
  }

  try {
    const clarifierLlm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.2,
      maxTokens: 500,
    }).pipe(new JsonOutputParser());

    // Safely handle different message types
    const historyString = history
      .map((msg) => {
        // Check if it's a BaseMessage with _getType or a Message with role
        const role =
          typeof msg._getType === "function"
            ? msg._getType()
            : (msg as unknown as { role: string }).role;

        return `${role}: ${msg.content}`;
      })
      .join("\n");

    // Construct user prompt string separately
    const userPrompt = `Conversation History:
${historyString}

Current Settings:
${JSON.stringify(currentSettings, null, 2)}

Latest User Message: "${latestUserInput}"

Missing Settings: ${missingSettings.join(", ") || "None"}`;

    const fullPrompt = createTimeoutPrompt(
      SETTINGS_CLARIFIER_SYSTEM_PROMPT,
      userPrompt
    );

    const timeoutMs = 20000;
    const timeoutPromise = createTimeoutPromise(
      timeoutMs,
      "Settings clarification timed out"
    );

    console.log("Invoking Settings Clarifier LLM...");
    const response = (await Promise.race([
      clarifierLlm.invoke(fullPrompt), // Pass combined prompt
      timeoutPromise,
    ])) as {
      updatedSettings: Partial<LessonSettings>;
      settingsAreComplete: boolean;
      clarificationQuestion: string | null;
    };

    console.log("Settings Clarifier LLM Response:", response);

    // Ensure response structure is valid
    if (
      !response ||
      typeof response.settingsAreComplete !== "boolean" ||
      typeof response.updatedSettings !== "object"
    ) {
      throw new Error(
        "Invalid response structure from settings clarifier LLM."
      );
    }

    const newSettings = { ...currentSettings, ...response.updatedSettings };

    // Ensure all keys in updatedSettings are valid LessonSettings keys - prevent pollution
    Object.keys(newSettings).forEach((key) => {
      if (!requiredSettings.includes(key as keyof LessonSettings)) {
        delete newSettings[key as keyof LessonSettings];
      }
    });

    if (response.clarificationQuestion) {
      yield { type: "chat", content: response.clarificationQuestion };
      if (state.threadId) {
        try {
          await saveMessage(state.threadId, {
            role: "assistant",
            content: response.clarificationQuestion,
          });
        } catch (error) {
          console.error("Error saving clarification question:", error);
        }
      }
      return {
        settings: newSettings,
        settingsComplete: false,
        messages: [...history, new AIMessage(response.clarificationQuestion)],
      };
    } else if (
      response.settingsAreComplete &&
      areSettingsComplete(newSettings)
    ) {
      // Double check completeness
      yield { type: "status", message: "Requirements gathered." };
      return { settings: newSettings, settingsComplete: true };
    } else {
      // If LLM says complete but our check fails, or if it doesn't give a question
      console.warn(
        "Settings clarification discrepancy or incomplete response. Asking generic question."
      );
      const genericQuestion = `Please provide the missing details: ${missingSettings.join(
        ", "
      )}.`;
      yield { type: "chat", content: genericQuestion };
      if (state.threadId) {
        try {
          await saveMessage(state.threadId, {
            role: "assistant",
            content: genericQuestion,
          });
        } catch (error) {
          console.error("Error saving generic question:", error);
        }
      }
      return {
        settings: newSettings,
        settingsComplete: false,
        messages: [...history, new AIMessage(genericQuestion)],
      };
    }
  } catch (error) {
    console.error("Error in settings clarifier:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Settings clarification failed";
    yield { type: "error", message: errorMessage };
    return { settingsComplete: false }; // Halt or allow retry? Keep settingsComplete false.
  }
});

// Node 1: Chat Responder (Post-Settings)
export const chat_responder = RunnableLambda.from(async function* (
  state: GraphState
): AsyncGenerator<any, Partial<GraphState>, void> {
  console.log("--- Node: chat_responder (Post-Settings) ---");
  const history = state.messages;
  const settings = state.settings;
  const initialUserInput = state.userInput;

  if (!areSettingsComplete(settings)) {
    console.error("Chat Responder: Settings incomplete.");
    yield { type: "error", message: "Internal error: Settings incomplete." };
    return {};
  }
  if (!initialUserInput) {
    console.error("Chat Responder: Initial user input missing.");
    yield { type: "error", message: "Internal error: User input missing." };
    return {};
  }

  try {
    const responderLlm = new ChatOpenAI({
      modelName: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 150,
    }).pipe(new StringOutputParser()); // Use StringOutputParser

    // Construct user prompt part
    const userPrompt = `Initial Request: "${initialUserInput}"
Final Settings: Grade ${settings.gradeLevel}, ${settings.tone} tone, ${settings.contentType} format, ${settings.length} length.`;

    const fullPrompt = createTimeoutPrompt(
      CHAT_RESPONDER_SYSTEM_PROMPT,
      userPrompt
    );

    const timeoutMs = 15000;
    const timeoutPromise = createTimeoutPromise(
      timeoutMs,
      "Chat response timed out"
    );

    console.log("Invoking Chat Responder LLM...");
    const streamedResponse = (await Promise.race([
      responderLlm.invoke(fullPrompt),
      timeoutPromise,
    ])) as string; // Expect string output

    console.log("Chat Responder Output:", streamedResponse);

    if (state.threadId) {
      try {
        await saveMessage(state.threadId, {
          role: "assistant",
          content: streamedResponse,
        });
      } catch (error) {
        console.error("Error saving ack message:", error);
      }
    }

    yield { type: "chat", content: streamedResponse };

    return { messages: [...history, new AIMessage(streamedResponse)] };
  } catch (error) {
    console.error("Error in post-settings chat responder:", error);
    const errorMessage =
      "I apologize, but I encountered an error confirming the details.";
    yield {
      type: "error",
      message: error instanceof Error ? error.message : "Chat response failed",
    };
    if (state.threadId) {
      try {
        await saveMessage(state.threadId, {
          role: "assistant",
          content: errorMessage,
        });
      } catch (dbError) {
        console.error("Error saving error message:", dbError);
      }
    }
    return { messages: [...history, new AIMessage(errorMessage)] };
  }
});

// Node 2: Content Planner
export const content_planner = RunnableLambda.from(async function* (
  state: GraphState
): AsyncGenerator<any, Partial<GraphState>, void> {
  console.log("--- Node: content_planner ---");
  const settings = state.settings;
  const initialUserInput = state.userInput;

  if (!areSettingsComplete(settings)) {
    console.error("Content Planner: Settings incomplete.");
    yield { type: "error", message: "Cannot plan: Settings incomplete." };
    return { plan: "Error: Settings incomplete." };
  }
  if (!initialUserInput) {
    console.error("Content Planner: Initial user input missing.");
    yield { type: "error", message: "Cannot plan: User input missing." };
    return { plan: "Error: User input missing." };
  }

  yield { type: "status", message: "Planning content...", currentStep: 1 };

  try {
    const plannerLlm = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview", // Keep powerful model for planning
      temperature: 0.7,
      maxTokens: 1000,
    }).pipe(new StringOutputParser());

    // Construct user prompt part
    const userPrompt = `Target audience: Grade ${settings.gradeLevel} students
Tone: ${settings.tone}
Length: ${settings.length}
Content Type: ${settings.contentType}

User's initial request: "${initialUserInput}"`;

    const fullPrompt = createTimeoutPrompt(
      CONTENT_PLANNER_SYSTEM_PROMPT,
      userPrompt
    );

    const timeoutMs = 30000;
    const timeoutPromise = createTimeoutPromise(
      timeoutMs,
      "Content planning timed out"
    );

    console.log("Invoking Planner LLM...");
    const contentPlan = (await Promise.race([
      plannerLlm.invoke(fullPrompt),
      timeoutPromise,
    ])) as string; // Expect string (Markdown)

    console.log(
      "Planner Output (Plan):",
      contentPlan.substring(0, 100) + "..."
    );

    if (state.threadId) {
      try {
        await saveMessage(state.threadId, {
          role: "assistant",
          content: `[Content Plan]
${contentPlan}`,
        });
        console.log("Content plan saved DB thread:", state.threadId);
      } catch (error) {
        console.error("Error saving content plan:", error);
      }
    }

    yield { type: "status", message: "Content plan generated", currentStep: 1 };
    return { plan: contentPlan };
  } catch (error) {
    console.error("Error in content planner:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Content planning failed";
    yield { type: "error", message: errorMessage };
    return { plan: `Error: Content planning failed. ${errorMessage}` };
  }
});

// Node 3: Content Generator
export const content_generator = RunnableLambda.from(async function* (
  state: GraphState
): AsyncGenerator<any, Partial<GraphState>, void> {
  console.log("--- Node: content_generator ---");
  const settings = state.settings;
  const plan = state.plan;

  if (!areSettingsComplete(settings)) {
    console.error("Content Generator: Settings incomplete.");
    yield { type: "error", message: "Cannot generate: Settings incomplete." };
    return { draftContent: "Error: Settings incomplete." };
  }
  if (!plan || plan.startsWith("Error:")) {
    console.error("Content Generator: Plan missing or invalid.");
    yield { type: "error", message: "Cannot generate: Invalid plan." };
    return { draftContent: "Error: Invalid plan." };
  }

  yield {
    type: "status",
    message: "Generating content draft...",
    currentStep: 1,
  };

  try {
    const generatorLlm = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0.7,
      maxTokens: 3000,
      streaming: true, // Keep streaming enabled here
    }); //.pipe(new StringOutputParser()); // Output is streamed, parser applied chunk-wise

    // Construct user prompt part
    const userPrompt = `Grade Level: ${settings.gradeLevel}
Tone: ${settings.tone}
Length: ${settings.length}
Content Type: ${settings.contentType}

Content Plan to follow:
<plan>
${plan}
</plan>`;

    const fullPrompt = createTimeoutPrompt(
      CONTENT_GENERATOR_SYSTEM_PROMPT,
      userPrompt
    );

    const timeoutMs = 120000; // Increased to 120 seconds for complex content
    const timeoutPromise = createTimeoutPromise(
      timeoutMs,
      "Content generation timed out. The content was too complex to generate within the time limit. Please try with a simpler request or shorter content length."
    );

    console.log("Invoking Generator LLM (Streaming)...");
    // Handle streaming generation with progress tracking
    let draftContent = "";
    let streamEnded = false;
    let lastProgressTime = Date.now();

    try {
      const stream = await Promise.race([
        generatorLlm.stream(fullPrompt),
        timeoutPromise as Promise<never>,
      ]);

      if (!stream)
        throw new Error("Stream initialization failed or timed out.");

      yield { type: "preview_stream_start" };

      for await (const chunk of stream) {
        const contentChunk = chunk?.content;
        if (typeof contentChunk === "string") {
          draftContent += contentChunk;
          lastProgressTime = Date.now(); // Update progress timestamp
          yield { type: "preview_stream_chunk", content: contentChunk };

          // Send periodic progress updates
          if (draftContent.length % 500 === 0) {
            yield {
              type: "status",
              message: `Generating content... (${draftContent.length} characters)`,
              currentStep: 1,
            };
          }
        }

        // Check for mini-timeout (no progress in 30 seconds)
        if (Date.now() - lastProgressTime > 30000) {
          throw new Error(
            "Content generation stalled - no progress in 30 seconds"
          );
        }
      }
      streamEnded = true;
      yield { type: "preview_stream_end" };
    } catch (streamError) {
      console.error("Error during content generation stream:", streamError);
      if (!streamEnded) {
        yield { type: "preview_stream_end" };
      }
      throw streamError;
    }

    console.log(
      "Generator Output (Draft):",
      draftContent.substring(0, 100) + "..."
    );

    if (state.threadId) {
      try {
        await saveMessage(state.threadId, {
          role: "assistant",
          content: `[Draft Content]
${draftContent}`,
        });
        console.log("Draft content saved DB thread:", state.threadId);
      } catch (error) {
        console.error("Error saving draft content:", error);
      }
    }

    yield {
      type: "status",
      message: "Initial content draft generated",
      currentStep: 1,
    };
    return { draftContent };
  } catch (error) {
    console.error("Error in content generator node:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Content generation failed";
    yield { type: "error", message: errorMessage };
    return {
      draftContent: `Error: Content generation failed. ${errorMessage}`,
    };
  }
});

// Node 4: Validator
export const validator = RunnableLambda.from(async function* (
  state: GraphState
): AsyncGenerator<any, Partial<GraphState>, void> {
  console.log("--- Node: validator ---");
  const contentToValidate = state.draftContent;
  const settings = state.settings;

  if (!contentToValidate || contentToValidate.startsWith("Error:")) {
    console.error("Validator: Draft content missing or invalid.");
    yield { type: "error", message: "Cannot validate: Invalid draft." };
    return {
      validation: {
        status: "validation_error",
        errors: [{ error_detail: "Missing content" }],
      },
    };
  }
  if (!areSettingsComplete(settings)) {
    console.error("Validator: Settings incomplete.");
    yield { type: "error", message: "Cannot validate: Settings incomplete." };
    return {
      validation: {
        status: "validation_error",
        errors: [{ error_detail: "Missing settings" }],
      },
    };
  }

  yield { type: "status", message: "Validating content...", currentStep: 2 };
  let validationResult: ValidationResult;

  try {
    const validatorLlm = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0,
      maxTokens: 1500,
    }).pipe(new JsonOutputParser());

    // Construct user prompt part
    const userPrompt = `Target Grade Level: ${settings.gradeLevel}
Content Type: ${settings.contentType}

Content to Validate:
<content>
${contentToValidate}
</content>`;

    const fullPrompt = createTimeoutPrompt(VALIDATOR_SYSTEM_PROMPT, userPrompt);

    const timeoutMs = 45000;
    const timeoutPromise = createTimeoutPromise(
      timeoutMs,
      "Validation timed out"
    );

    console.log("Invoking Validator LLM...");
    validationResult = (await Promise.race([
      validatorLlm.invoke(fullPrompt),
      timeoutPromise,
    ])) as ValidationResult;
    console.log("Validator Output:", validationResult);

    // Validate LLM output structure
    if (!validationResult || !validationResult.status) {
      throw new Error("Invalid JSON structure from validation LLM.");
    }
    // Correct potential inconsistencies
    if (
      validationResult.status === "errors_found" &&
      (!validationResult.errors || validationResult.errors.length === 0)
    ) {
      console.warn(
        "Validation status 'errors_found' but no errors listed. Correcting to 'valid'."
      );
      validationResult.status = "valid";
      validationResult.errors = [];
    }
    if (
      validationResult.status === "valid" &&
      validationResult.errors &&
      validationResult.errors.length > 0
    ) {
      console.warn(
        "Validation status 'valid' but errors listed. Correcting to 'errors_found'."
      );
      validationResult.status = "errors_found";
    }

    if (state.threadId) {
      try {
        await saveMessage(state.threadId, {
          role: "assistant",
          content: `[Validation Results]
${JSON.stringify(validationResult, null, 2)}`,
        });
        console.log("Validation results saved DB thread:", state.threadId);
      } catch (error) {
        console.error("Error saving validation results:", error);
      }
    }

    yield {
      type: "status",
      message: `Validation complete: ${validationResult.status}`,
      currentStep: 2,
    };
    return { validation: validationResult };
  } catch (error) {
    console.error("Error in validator:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Validation process failed";
    validationResult = {
      status: "validation_error",
      errors: [{ error_detail: errorMessage, location: "Validator Node" }],
    };
    if (state.threadId) {
      try {
        await saveMessage(state.threadId, {
          role: "assistant",
          content: `[Validation Error]
${JSON.stringify(validationResult, null, 2)}`,
        });
      } catch (dbError) {
        console.error("Error saving validation error:", dbError);
      }
    }
    yield { type: "error", message: errorMessage };
    return { validation: validationResult };
  }
});

// Node 5: Refiner
export const refiner = RunnableLambda.from(async function* (
  state: GraphState
): AsyncGenerator<any, Partial<GraphState>, void> {
  console.log("--- Node: refiner ---");
  const validation = state.validation;
  const draftContent = state.draftContent;
  const currentRetryCount = state.retryCount || 0;

  // **Input Validation** (More specific check)
  if (!validation || validation.status !== "errors_found") {
    // Only run if errors were explicitly found
    console.error(
      "Refiner: Invalid validation state (must be 'errors_found'). Skipping."
    );
    // If skipping, we should return the current state unchanged or route differently?
    // For now, return unchanged draft and existing retry count. The graph logic decides next step.
    // Yielding an error might be too strong if validation was 'valid' or 'validation_error'
    yield {
      type: "status",
      message: `Skipping refinement: Validation status is ${validation?.status}.`,
    };
    return { draftContent: draftContent, retryCount: currentRetryCount }; // Return current state essentially
  }
  if (!draftContent || draftContent.startsWith("Error:")) {
    console.error("Refiner: Draft content missing or invalid.");
    yield { type: "error", message: "Cannot refine: Invalid draft." };
    // Increment retry count even on error to prevent infinite loops if upstream node keeps failing
    return { retryCount: currentRetryCount + 1 };
  }

  yield {
    type: "status",
    message: `Refining content (Attempt ${currentRetryCount + 1})...`,
    currentStep: 3,
  };

  try {
    const refinerLlm = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature: 0.5,
      maxTokens: 3500,
      streaming: true, // Keep streaming enabled
    });

    // Construct user prompt part
    const userPrompt = `Validation Feedback:
${JSON.stringify(validation, null, 2)}

Original Draft Content:
<content>
${draftContent}
</content>`;

    const fullPrompt = createTimeoutPrompt(REFINER_SYSTEM_PROMPT, userPrompt);

    const timeoutMs = 75000; // Increased timeout
    const timeoutPromise = createTimeoutPromise(
      timeoutMs,
      "Refinement timed out"
    );

    console.log("Invoking Refiner LLM (Streaming)...");
    // Handle streaming generation
    let refinedContent = "";
    let streamEnded = false;
    yield { type: "preview_stream_start" };

    try {
      const stream = await Promise.race([
        refinerLlm.stream(fullPrompt),
        timeoutPromise as Promise<never>,
      ]);

      if (!stream)
        throw new Error("Stream initialization failed or timed out.");

      for await (const chunk of stream) {
        const contentChunk = chunk?.content;
        if (typeof contentChunk === "string") {
          refinedContent += contentChunk;
          yield { type: "preview_stream_chunk", content: contentChunk };
        }
      }
      streamEnded = true;
      yield { type: "preview_stream_end" };
    } catch (streamError) {
      console.error("Error during refinement stream:", streamError);
      if (!streamEnded) {
        yield { type: "preview_stream_end" };
      }
      throw streamError;
    }

    console.log(
      "Refiner Output (Refined Draft):",
      refinedContent.substring(0, 100) + "..."
    );

    if (state.threadId) {
      try {
        await saveMessage(state.threadId, {
          role: "assistant",
          content: `[Refined Content - Attempt ${currentRetryCount + 1}]
${refinedContent}`,
        });
        console.log(
          `Refined content (Attempt ${currentRetryCount + 1}) saved DB thread:`,
          state.threadId
        );
      } catch (error) {
        console.error("Error saving refined content:", error);
      }
    }

    yield {
      type: "status",
      message: "Content refinement complete",
      currentStep: 3,
    };
    // Return refined content and increment retry count
    return { draftContent: refinedContent, retryCount: currentRetryCount + 1 };
  } catch (error) {
    console.error("Error in refiner node:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Refinement process failed";
    yield { type: "error", message: errorMessage };
    // Return original draft? Or empty? Let's return original to allow formatting attempt
    // Crucially, still increment retry count
    return { draftContent: draftContent, retryCount: currentRetryCount + 1 };
  }
});

// Node 6: Formatter
export const formatter = RunnableLambda.from(async function* (
  state: GraphState
): AsyncGenerator<any, Partial<GraphState>, void> {
  console.log("--- Node: formatter ---");
  const draftContent = state.draftContent;
  const settings = state.settings;
  const validation = state.validation;
  const initialUserInput = state.userInput; // Get initial user input for context

  if (!draftContent || draftContent.startsWith("Error:")) {
    console.error("Formatter: Draft content missing or invalid.");
    yield { type: "error", message: "Cannot format: Invalid draft." };
    return { finalContent: "Error: No content available to format." };
  }
  if (!areSettingsComplete(settings)) {
    console.error("Formatter: Settings incomplete.");
    yield { type: "error", message: "Cannot format: Settings incomplete." };
    return { finalContent: "Error: Settings missing." };
  }

  yield {
    type: "status",
    message: "Formatting final content...",
    currentStep: 3,
  };
  let finalContent = draftContent;

  try {
    const title = `${settings.contentType || "Math Content"} (Grade ${
      settings.gradeLevel || "N/A"
    } - ${settings.length || "Standard"} Length)`;
    // Use initial user input if available for a more specific topic title
    const topic = initialUserInput
      ? `Topic: ${initialUserInput}`
      : "Topic: As requested";

    const header = `# ${title}\n**${topic}**\n**Tone:** ${
      settings.tone || "Neutral"
    }\n**Name:** _________________   **Date:** __________\n<hr/>\n\n`;

    let footer = "\n<hr/>\n_Generated by AI Assistant_";

    const validationStatus = validation?.status;
    const retryCount = state.retryCount || 0;

    if (validationStatus === "errors_found" && retryCount >= 3) {
      footer += `\n\n**Note:** Automatic refinement reached its limit (${retryCount} attempts). The content was formatted, but may still contain errors identified during validation. Please review carefully.`;
      if (validation?.errors && validation.errors.length > 0) {
        footer += `\n*Potential Issues:*\n${validation.errors
          .map((e) => `- ${e.error_detail} (${e.location || "unknown"})`)
          .join("\n")}`;
      }
    } else if (validationStatus === "validation_error") {
      footer +=
        "\n\n**Note:** The content validation process encountered an error and could not be completed.";
    } else if (validationStatus === "errors_found") {
      // This implies errors were found but refinement didn't happen or didn't fix them
      footer +=
        "\n\n**Note:** Content validation identified potential issues. Please review carefully.";
      if (validation?.errors && validation.errors.length > 0) {
        footer += `\n*Potential Issues:*\n${validation.errors
          .map((e) => `- ${e.error_detail} (${e.location || "unknown"})`)
          .join("\n")}`;
      }
    }

    finalContent = header + finalContent + footer;

    if (state.threadId) {
      try {
        await saveMessage(state.threadId, {
          role: "assistant",
          content: `[Final Formatted Content]
${finalContent}`,
        });
        console.log("Final formatted content saved DB thread:", state.threadId);
      } catch (error) {
        console.error("Error saving formatted content:", error);
      }
    }

    console.log(
      "Final Formatted Content (First 150 chars):",
      finalContent.substring(0, 150) + "..."
    );

    // Yield the final content object
    yield {
      type: "final_content",
      content: finalContent,
      metadata: {
        title: title,
        contentType: settings.contentType,
        gradeLevel: settings.gradeLevel,
        length: settings.length,
        tone: settings.tone,
        validationStatus: validationStatus || "unknown",
        validationErrors: validation?.errors || [],
        timestamp: new Date().toISOString(),
      },
    };

    yield { type: "status", message: "Processing complete.", currentStep: 4 };
  } catch (error) {
    console.error("Error during formatting:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed during final formatting";
    yield { type: "error", message: errorMessage };
    yield {
      type: "final_content",
      content: `Error during formatting: ${errorMessage}\n\n---\n\n${draftContent}`,
    }; // Fallback
  }

  return { finalContent: finalContent };
});

// --- Conditional Edges ---

// Decide if settings are complete
export const decide_if_settings_complete = (
  state: GraphState
): "settings_clarifier" | "chat_responder" => {
  console.log("--- Decision: decide_if_settings_complete ---");
  // Use the helper function AND the flag for robustness
  const complete =
    areSettingsComplete(state.settings) && state.settingsComplete === true;
  if (complete) {
    console.log("Settings complete. Proceeding to chat_responder.");
    return "chat_responder";
  } else {
    console.log(
      `Settings incomplete (Flag: ${
        state.settingsComplete
      }, Check: ${areSettingsComplete(
        state.settings
      )}). Looping back to settings_clarifier.`
    );
    return "settings_clarifier";
  }
};

// Decide next path after validation
export const decideValidationPath = (
  state: GraphState
): "refiner" | "formatter" => {
  console.log("--- Decision: decideValidationPath ---");
  const validationStatus = state.validation?.status;
  const retryCount = state.retryCount || 0;

  if (!state.validation) {
    console.warn("Validation result missing, proceeding to formatter.");
    return "formatter";
  }

  console.log(
    `Validation status: ${validationStatus}, Retry count: ${retryCount}`
  );

  // Go to refiner ONLY if errors were found AND retries are left
  if (validationStatus === "errors_found" && retryCount < 3) {
    console.log(
      "Validation found errors, retries remain. Proceeding to refiner."
    );
    return "refiner";
  } else {
    if (validationStatus === "errors_found") {
      // Log if errors remain but retries exhausted
      console.warn(
        `Max refinement retries (${retryCount}) reached. Proceeding to formatter despite errors.`
      );
    } else {
      // Log if valid or validation error
      console.log(
        `Validation status is '${validationStatus}'. Proceeding to formatter.`
      );
    }
    return "formatter"; // Proceed to formatter if valid, validation_error, or retries exhausted
  }
};
