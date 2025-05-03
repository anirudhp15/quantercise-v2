"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownWorksheetProps {
  content: string;
  className?: string;
  title?: string;
}

export const MarkdownWorksheet: React.FC<MarkdownWorksheetProps> = ({
  content,
  className,
  title = "Worksheet",
}) => {
  // Add worksheet header with name and date fields
  const enhancedContent = `
# ${title}

**Name:** __________________________________ **Date:** ______________

${content}
  `.trim();

  return (
    <div
      className={cn(
        "bg-white text-black p-8 rounded-md shadow-md min-h-[1100px] max-w-4xl mx-auto",
        className
      )}
    >
      <div className="prose prose-sm prose-black max-w-none">
        <ReactMarkdown>{enhancedContent}</ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownWorksheet;
