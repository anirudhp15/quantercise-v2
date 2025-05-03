import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@supabase/supabase-js";
import { StateGraph, END, START, StateGraphArgs } from "@langchain/langgraph";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
// import { saveMessage, savePreview } from "./database"; // Comment out DB imports for minimal test

// Define interface for our graph state (Keep this)
interface QuanterciseState {
  userInput: string;
  sessionId: string;
  normalizedInput?: string;
  intent?: string;
  context?: any[];
  outline?: string;
  preview?: string;
  validationResult?: {
    status: "approved" | "rejected";
    reasons?: string[];
    sections?: string[];
  };
  refinedPreview?: string;
  error?: string;
  // Add temporary fields for testing nodes
  nodeA_output?: string;
  nodeB_output?: string;
}

// --- Minimal Node Implementations ---
const nodeA = async (
  state: QuanterciseState
): Promise<Partial<QuanterciseState>> => {
  console.log("--- Running Node A ---");
  console.log("Input:", state.userInput);
  return { nodeA_output: `Node A processed: ${state.userInput}` };
};

const nodeB = async (
  state: QuanterciseState
): Promise<Partial<QuanterciseState>> => {
  console.log("--- Running Node B ---");
  console.log("From Node A:", state.nodeA_output);
  return { nodeB_output: `Node B saw: ${state.nodeA_output}` };
};

// --- Comment out original nodes ---
/*
// Initialize Supabase client for vector storage
const supabaseClient = createClient(
// ... rest of original nodes ...
const previewFormatter = async (state: QuanterciseState): Promise<any> => {
  // ... 
};
const decideValidationPath = (
// ...
);
const routeAfterIntent = (
// ...
);
*/

// --- Minimal Graph Definition ---
export const createQuanterciseGraph = () => {
  const graphArgs: StateGraphArgs<QuanterciseState> = {
    channels: {
      // Define channels just for the fields used/updated by minimal nodes
      userInput: { value: (x, y) => y, default: () => "" },
      sessionId: { value: (x, y) => y, default: () => "" },
      nodeA_output: { value: (x, y) => y, default: () => undefined },
      nodeB_output: { value: (x, y) => y, default: () => undefined },
      // Include other state fields so the type matches QuanterciseState
      normalizedInput: { value: (x, y) => y, default: () => undefined },
      intent: { value: (x, y) => y, default: () => undefined },
      context: { value: (x, y) => y, default: () => undefined },
      outline: { value: (x, y) => y, default: () => undefined },
      preview: { value: (x, y) => y, default: () => undefined },
      validationResult: { value: (x, y) => y, default: () => undefined },
      refinedPreview: { value: (x, y) => y, default: () => undefined },
      error: { value: (x, y) => y, default: () => undefined },
    },
  };

  const workflow = new StateGraph<QuanterciseState>(graphArgs);

  // Add minimal nodes
  workflow.addNode("NodeA", nodeA);
  workflow.addNode("NodeB", nodeB);

  // Define edges with the correct type annotations
  workflow.addEdge(START, "NodeA");
  workflow.addEdge("NodeA", "NodeB");
  workflow.addEdge("NodeB", END);

  console.log("Compiling Minimal Test Graph...");
  return workflow.compile();
};

export const graph = createQuanterciseGraph();
console.log("Minimal Test Graph instance created.");

// --- Keep export functions, but note they use the MINIMAL graph now ---
export async function processQuanterciseChat(
  userInput: string,
  sessionId: string
): Promise<any> {
  try {
    // Note: This invokes the MINIMAL graph
    const result = await graph.invoke({ userInput, sessionId });
    return result as QuanterciseState;
  } catch (error) {
    console.error("Error processing chat (minimal graph):", error);
    throw error;
  }
}

export async function* streamQuanterciseChat(
  userInput: string,
  sessionId: string
): AsyncGenerator<any, void, unknown> {
  try {
    // Note: This streams the MINIMAL graph
    const stream = await graph.stream({ userInput, sessionId });
    for await (const chunk of stream) {
      yield chunk;
    }
  } catch (error) {
    console.error("Error streaming chat (minimal graph):", error);
    yield {
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
