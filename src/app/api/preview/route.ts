import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { PreviewRequest } from "@/types";

// Create a Supabase client with the service role key (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const {
      threadId,
      content,
      chatContent,
      presentationContent,
      contentMetadata,
      statusMessages,
      currentStep,
      // Additional metadata fields
      contentType,
      targetAudience,
      estimatedDuration,
      tone,
      complexityLevel,
      subjectArea,
      tags = [],
    } = (await req.json()) as PreviewRequest;

    if (!threadId || !(content || chatContent || presentationContent)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use the combined content or separate contents as appropriate
    const finalContent = content || "";
    const finalChatContent = chatContent || content || "";
    const finalPresentationContent = presentationContent || content || "";

    // Create or extend metadata with lesson settings
    const finalMetadata = {
      version: "1.0",
      contentType: contentType || "worksheet",
      hasStructuredContent: !!chatContent || !!presentationContent,
      targetAudience,
      estimatedDuration,
      tone,
      complexityLevel,
      subjectArea,
      ...(contentMetadata || {}),
      updatedAt: new Date().toISOString(),
    };

    // Try using our specialized database function first
    try {
      // Call the save_thread_preview function
      const { data: savedPreview, error: fnError } = await supabaseAdmin.rpc(
        "save_thread_preview",
        {
          p_thread_id: threadId,
          p_content: finalContent,
          p_chat_content: finalChatContent,
          p_presentation_content: finalPresentationContent,
          p_metadata: finalMetadata,
          p_status_messages: Array.isArray(statusMessages)
            ? statusMessages
            : [],
          p_current_step: currentStep || 2,
        }
      );

      if (fnError) {
        console.warn("Error using save_thread_preview RPC:", fnError);
        // Fall back to direct upsert method if the function fails
        throw fnError;
      }

      // Now store extended metadata if available
      if (savedPreview) {
        try {
          // Call save_content_metadata function with all the settings
          const { data: savedMetadata, error: metaError } =
            await supabaseAdmin.rpc("save_content_metadata", {
              p_thread_id: threadId,
              p_preview_id: savedPreview,
              p_content_type:
                contentType || finalMetadata.contentType || "educational",
              p_target_audience: targetAudience || null,
              p_estimated_duration: estimatedDuration || null,
              p_tone: tone || null,
              p_complexity_level: complexityLevel || null,
              p_subject_area: subjectArea || null,
              p_tags: tags && Array.isArray(tags) ? tags : null,
              p_custom_settings: finalMetadata,
            });

          if (metaError) {
            console.warn("Error saving extended metadata:", metaError);
          }
        } catch (metaError) {
          console.warn("Exception saving extended metadata:", metaError);
        }
      }

      // Fetch the complete preview data
      const { data: fullPreview, error: fetchError } = await supabaseAdmin.rpc(
        "get_thread_preview",
        { p_thread_id: threadId }
      );

      if (fetchError) {
        console.warn("Error fetching complete preview data:", fetchError);
      }

      return NextResponse.json({
        success: true,
        data: fullPreview || savedPreview,
      });
    } catch (fnError) {
      console.warn(
        "Function approach failed, falling back to direct upsert:",
        fnError
      );
    }

    // Fall back to direct upsert if the function call fails
    const { data, error } = await supabaseAdmin
      .from("thread_previews")
      .upsert(
        {
          thread_id: threadId,
          content: finalContent,
          chat_content: finalChatContent,
          presentation_content: finalPresentationContent,
          content_metadata: finalMetadata,
          status_messages: Array.isArray(statusMessages) ? statusMessages : [],
          current_step: currentStep || 2,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "thread_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving preview data:", error);
      return NextResponse.json(
        { error: `Failed to save preview: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in preview API:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
