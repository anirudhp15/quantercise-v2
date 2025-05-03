"use client";

import React, { useEffect, useRef } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

interface MathRendererProps {
  expression: string;
  displayMode?: boolean;
  errorColor?: string;
  className?: string;
}

export default function MathRenderer({
  expression,
  displayMode = false,
  errorColor = "#cc0000",
  className = "",
}: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && expression) {
      try {
        katex.render(expression, containerRef.current, {
          displayMode: displayMode,
          errorColor: errorColor,
          throwOnError: false,
        });
      } catch (error) {
        console.error("Error rendering math expression:", error);
        if (containerRef.current) {
          containerRef.current.textContent = `Error rendering: ${expression}`;
        }
      }
    }
  }, [expression, displayMode, errorColor]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "math-renderer",
        displayMode
          ? "block my-4 text-center overflow-x-auto"
          : "inline-block align-middle",
        "text-[1.1em]", // Slightly larger than normal text
        "katex-container", // Custom class for additional styling
        className
      )}
      style={{
        // Add custom styles for better rendering
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
      }}
    />
  );
}

// Add global styles for KaTeX
const globalStyles = `
.katex-container .katex {
  font-size: inherit;
  font-weight: 400;
  line-height: 1.4;
}

.katex-container .katex-display {
  margin: 1em 0;
  padding: 0.5em 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.katex-container .katex-display > .katex {
  display: inline-block;
  white-space: nowrap;
  max-width: 100%;
  text-align: center;
}

/* Improve spacing for inline math */
.katex-container:not(.block) {
  padding: 0 0.15em;
  vertical-align: baseline;
}

/* Dark theme adjustments */
.katex-container .katex {
  color: inherit;
}

/* Scrollbar styling for overflow */
.katex-container::-webkit-scrollbar {
  height: 4px;
}

.katex-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.katex-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.katex-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
`;

// Create and inject global styles
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = globalStyles;
  document.head.appendChild(style);
}
