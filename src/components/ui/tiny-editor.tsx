"use client";

import React, { useState, useRef, useSyncExternalStore } from "react";

import dynamic from "next/dynamic";
import { Loader2, Code, Eye } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export interface TinyEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  id?: string;
}

// Dynamically import TinyMCE React Editor with SSR disabled
const TinyMceEditor = dynamic(
  () => import("@tinymce/tinymce-react").then((mod) => mod.Editor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-64 w-full items-center justify-center rounded-md border border-input bg-muted/20 text-muted-foreground">
        <div className="flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>กำลังโหลดตัวแก้ไขข้อความ (Tiny Editor)...</span>
        </div>
      </div>
    ),
  }
);

const emptySubscribe = () => () => {};

export function TinyEditor({
  value,
  onChange,
  placeholder = "พิมพ์เนื้อหาข่าวที่นี่...",
  height = 360,
  disabled = false,
  id,
}: TinyEditorProps) {
  const { resolvedTheme } = useTheme();
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [viewSource, setViewSource] = useState(false);
  const editorRef = useRef<unknown>(null);

  const isDark = mounted && resolvedTheme === "dark";


  return (
    <div className="space-y-1.5 tiny-editor-container">
      {/* TinyMCE Aux z-index fix for Radix Dialog */}
      <style jsx global>{`
        .tox-tinymce-aux {
          z-index: 99999 !important;
        }
        .tox-tinymce {
          border-radius: 0.375rem !important;
          border-color: var(--color-input, #e2e8f0) !important;
        }
        .tox .tox-toolbar-overlord,
        .tox .tox-toolbar,
        .tox .tox-toolbar__overflow,
        .tox .tox-toolbar__primary {
          background-color: var(--color-muted, #f8fafc) !important;
        }
      `}</style>

      <div className="flex items-center justify-between pb-1">
        <span className="text-xs text-muted-foreground">
          {viewSource ? "โหมดแก้ไขโค้ด HTML" : "โหมด Tiny Rich-Text Editor"}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setViewSource((prev) => !prev)}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
        >
          {viewSource ? (
            <>
              <Eye className="h-3 w-3" />
              <span>ดูแบบ Visual</span>
            </>
          ) : (
            <>
              <Code className="h-3 w-3" />
              <span>ดู HTML</span>
            </>
          )}
        </Button>
      </div>

      {viewSource ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={12}
          disabled={disabled}
          placeholder="<p>เนื้อหาข่าวแบบ HTML...</p>"
          className="w-full rounded-md border border-input bg-background p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary"
        />
      ) : (
        <div className="overflow-hidden rounded-md border border-input">
          {mounted ? (
            <TinyMceEditor
              id={id}
              tinymceScriptSrc="https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.3/tinymce.min.js"
              onInit={(_evt, editor) => {
                editorRef.current = editor;
              }}
              value={value}
              disabled={disabled}
              onEditorChange={(content) => onChange(content)}
              init={{
                height,
                menubar: false,
                branding: false,
                promotion: false,
                placeholder,
                skin: isDark ? "oxide-dark" : "oxide",
                content_css: isDark ? "dark" : "default",
                plugins: [
                  "advlist",
                  "autolink",
                  "lists",
                  "link",
                  "image",
                  "charmap",
                  "preview",
                  "anchor",
                  "searchreplace",
                  "visualblocks",
                  "code",
                  "fullscreen",
                  "insertdatetime",
                  "media",
                  "table",
                  "wordcount",
                ],
                toolbar:
                  "undo redo | blocks | bold italic underline forecolor backcolor | " +
                  "alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | " +
                  "link table | removeformat code fullscreen",
                content_style: `
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Sarabun", sans-serif;
                    font-size: 14px;
                    line-height: 1.6;
                    color: ${isDark ? "#f8fafc" : "#0f172a"};
                    background-color: ${isDark ? "#0f172a" : "#ffffff"};
                    padding: 12px;
                  }
                  p { margin-bottom: 0.75rem; }
                  h1, h2, h3, h4, h5, h6 { font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; }
                  ul, ol { padding-left: 1.5rem; margin-bottom: 0.75rem; }
                  table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
                  table td, table th { border: 1px solid #cbd5e1; padding: 6px 10px; }
                `,
                language: "th_TH",
                language_url: "", // fallback to English UI strings if custom locale file is not present
              }}
            />
          ) : (
            <div className="flex h-64 w-full items-center justify-center bg-muted/20 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
