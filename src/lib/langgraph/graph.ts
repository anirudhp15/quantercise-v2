// This file defines the LangGraph workflow for generating math content using a parallel architecture

import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for vector storage
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Create models with appropriate settings
const chatModel = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.7,
  streaming: true,
});

const intentModel = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.2,
});

const plannerModel = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
  temperature: 0.3,
});

const previewModel = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0.2,
});

const validatorModel = new ChatOpenAI({
  modelName: "gpt-4",
  temperature: 0,
});

const embeddings = new OpenAIEmbeddings({
  modelName: "text-embedding-3-small",
});

// Node implementations
const chatRouter = async (state) => {
  // Clean and normalize user input
  const normalizedInput = state.userInput?.trim() || "";

  return {
    normalizedInput,
    sessionId: state.sessionId || crypto.randomUUID(),
  };
};

const intentAgent = async (state) => {
  // Classify user intent (explain, solve, generate, etc.)
  const intentPrompt = `
    Classify the user's intent into one of these categories:
    - explain: User wants explanation of a concept
    - solve: User wants a problem solved
    - generate: User wants to generate practice problems
    - visualize: User wants visual representation
    - other: None of the above
    
    User input: ${state.normalizedInput || state.userInput}
    
    Return only one word from the categories above.
  `;

  const intent = await intentModel.invoke(intentPrompt);
  const intentText = intent.content.toString().toLowerCase().trim();

  return { intent: intentText };
};

const chat_responder = async function* (state) {
  // Yield initial status message
  yield { type: "status", message: "Working on it..." };

  // Prepare prompt based on intent
  const prompt = `
    You are an AI calculus tutor. The user's question is about: ${
      state.intent || "mathematics"
    }.
    
    Respond helpfully to: ${state.normalizedInput || state.userInput}
    
    Keep your response conversational and friendly. Let them know you're working on a more detailed response in parallel.
  `;

  // Stream response
  const response = await chatModel.invoke(prompt);

  return {
    type: "chat",
    content: response.content.toString(),
  };
};

const contextRetriever = async (state) => {
  try {
    const { data: matchResults } = await supabaseClient.rpc("match_documents", {
      query_embedding: await embeddings.embedQuery(
        state.normalizedInput || state.userInput || ""
      ),
      match_count: 10,
    });

    return { context: matchResults || [] };
  } catch (error) {
    console.error("Error retrieving context:", error);
    return {
      context: [],
      error: `Context retrieval error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};

const content_planner = async (state) => {
  const contextText = state.context
    ? state.context.map((item) => item.content).join("\n\n")
    : "No specific context available.";

  const planPrompt = `
    Based on the user's request: "${
      state.normalizedInput || state.userInput
    }" (intent: ${state.intent}),
    create a 3-5 step outline for a comprehensive response.
    
    Relevant context:
    ${contextText}
    
    Format your response as a numbered list with brief descriptions for each step.
  `;

  const planResponse = await plannerModel.invoke(planPrompt);

  return { outline: planResponse.content.toString() };
};

const content_generator = async (state) => {
  const contextText = state.context
    ? state.context.map((item) => item.content).join("\n\n")
    : "No specific context available.";

  const previewPrompt = `
    You are creating a comprehensive calculus resource based on this outline:
    
    ${state.outline}
    
    User's original request: "${
      state.normalizedInput || state.userInput
    }" (intent: ${state.intent})
    
    Relevant context:
    ${contextText}
    
    Expand the outline into a complete, detailed response. Include mathematical equations using LaTeX notation, examples, and clear explanations. Ensure mathematical accuracy and clarity.
  `;

  const previewResponse = await previewModel.invoke(previewPrompt);

  return { preview: previewResponse.content.toString() };
};

const validator = async (state) => {
  const validatorPrompt = `
    You are a mathematics expert responsible for validating educational content.
    
    Review this calculus content for mathematical accuracy, clarity, and completeness:
    
    ${state.preview}
    
    Evaluate based on:
    1. Mathematical accuracy (formulas, definitions, solutions)
    2. Conceptual clarity
    3. Appropriate difficulty level
    4. Quality of examples
    
    Return ONLY ONE of these exact strings:
    - "approved" if the content is accurate and high quality
    - "rejected" if there are significant errors or issues that must be fixed
    
    If rejected, also list the specific issues found in a numbered list.
  `;

  const validationResponse = await validatorModel.invoke(validatorPrompt);
  const validationText = validationResponse.content.toString();

  // Parse validation result
  const isApproved = validationText.toLowerCase().includes("approved");
  const status = isApproved ? "approved" : "rejected";

  // Extract reasons if rejected
  const reasons = !isApproved
    ? validationText
        .split("\n")
        .filter((line) => /^\d+\./.test(line.trim()))
        .map((line) => line.trim())
    : [];

  return {
    validationResult: {
      status,
      reasons,
      sections: reasons
        .map((r) => r.match(/in ([^:]+):/)?.[1] || "general")
        .filter(Boolean),
    },
  };
};

const errorLogger = async (state) => {
  if (state.validationResult?.status === "rejected") {
    console.error("Validation failed:", {
      sessionId: state.sessionId,
      intent: state.intent,
      sections: state.validationResult.sections,
      reasons: state.validationResult.reasons,
    });
  }

  return {};
};

const refiner = async (state) => {
  const refinedPrompt = `
    The previously generated content had these issues:
    ${state.validationResult?.reasons?.join("\n") || "Unknown issues"}
    
    Original content:
    ${state.preview}
    
    Please fix these issues while preserving the overall structure. Focus specifically on correcting mathematical errors and improving clarity.
  `;

  const refinedResponse = await previewModel.invoke(refinedPrompt);

  return { refinedPreview: refinedResponse.content.toString() };
};

const formatter = async (state) => {
  const content =
    state.validationResult?.status === "approved"
      ? state.preview
      : state.refinedPreview || state.preview;

  return {
    type: "preview",
    content: content,
    validated: state.validationResult?.status === "approved",
  };
};

// Custom decision function for branching
const decideValidationPath = (state) => {
  return state.validationResult?.status === "approved"
    ? "formatter"
    : "refiner";
};

// --- Graph Definition ---
// Create the workflow graph
const workflow = new StateGraph({
  channels: {
    userInput: "",
    sessionId: "",
    normalizedInput: undefined,
    intent: undefined,
    context: undefined,
    outline: undefined,
    preview: undefined,
    validationResult: undefined,
    refinedPreview: undefined,
    error: undefined,
  },
});

// Add nodes to the graph
workflow.addNode("ChatRouter", chatRouter);
workflow.addNode("IntentAgent", intentAgent);
workflow.addNode("chat_responder", chat_responder);
workflow.addNode("contextRetriever", contextRetriever);
workflow.addNode("content_planner", content_planner);
workflow.addNode("content_generator", content_generator);
// Specify the potential destination nodes for validator
workflow.addNode("validator", validator, {
  // Explicitly define that validator can route to both refiner and formatter
  ends: ["refiner", "formatter"],
});
workflow.addNode("errorLogger", errorLogger);
workflow.addNode("refiner", refiner);
workflow.addNode("formatter", formatter);

// Define the flow with our parallel architecture
workflow.addEdge(START, "ChatRouter");
workflow.addEdge("ChatRouter", "IntentAgent");

// Fork into parallel paths
workflow.addEdge("IntentAgent", "chat_responder");
workflow.addEdge("IntentAgent", "contextRetriever");

// Background processing path
workflow.addEdge("contextRetriever", "content_planner");
workflow.addEdge("content_planner", "content_generator");
workflow.addEdge("content_generator", "validator");

// Validation and refinement
workflow.addConditionalEdges("validator", decideValidationPath, {
  refiner: "errorLogger", // Changed: route to errorLogger first when refinement needed
  formatter: "formatter",
});

// Connect errorLogger to refiner
workflow.addEdge("errorLogger", "refiner");
workflow.addEdge("refiner", "validator");

// End paths
workflow.addEdge("chat_responder", END);
workflow.addEdge("formatter", END);

// Compile the graph
export const app = workflow.compile({
  name: "quantercise-v2",
});

console.log(
  "Quantercise LangGraph v2 compiled with parallel architecture for streaming chats and rich previews"
);
