import React, { useRef, useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import api from "../api";

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export default function ResumeUploader({
  onUploaded,
  existingUrl = "",
  maxSizeMB = 8,
  uploadEndpoint = "/api/uploads/resume",
  className,
}) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  function humanSize(bytes) {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${Math.round(bytes / 1024)} KB` : `${mb.toFixed(1)} MB`;
  }

  function validateFile(f) {
    if (!f) return "No file selected";
    if (!ACCEPTED_TYPES.includes(f.type))
      return "Unsupported file type. Please upload PDF, DOC or DOCX.";
    if (f.size > maxSizeMB * 1024 * 1024)
      return `File too large. Max size is ${maxSizeMB} MB.`;
    return null;
  }

  const onSelectFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) return toast.error(err);
    setFile(f);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (!f) return;
    const err = validateFile(f);
    if (err) return toast.error(err);
    setFile(f);
  };

  async function upload(selectedFile) {
    const f = selectedFile || file;
    if (!f) return toast.error("Please choose a file first");

    const fd = new FormData();
    fd.append("file", f);

    setUploading(true);
    setProgress(0);
    try {
      const res = await api.post(uploadEndpoint, fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (ev) => {
          if (!ev.lengthComputable) return;
          setProgress(Math.round((ev.loaded * 100) / ev.total));
        },
      });

      const url = res?.data?.url || res?.data?.link || "";
      if (!url) throw new Error("Upload completed but no URL returned");
      toast.success("Resume uploaded");
      setFile(null);
      setProgress(0);
      onUploaded?.(url);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.error || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function clearFile() {
    setFile(null);
    setProgress(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={clsx("w-full", className)}>
      <div
        className={clsx(
          "rounded-lg border border-dashed p-4 sm:p-5 flex items-center justify-between gap-4 transition-colors cursor-pointer",
          dragActive
            ? "bg-primary/5 border-primary/30"
            : "bg-card hover:bg-muted/40"
        )}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center text-lg">
            📄
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">Resume</div>
            <div className="text-xs text-muted-foreground mt-1">
              {file ? (
                <>
                  {file.name} • {humanSize(file.size)}
                </>
              ) : existingUrl ? (
                <a
                  href={existingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  View uploaded resume
                </a>
              ) : (
                <>
                  Drag & drop your resume or{" "}
                  <label
                    htmlFor="resume-input"
                    className="text-primary hover:underline cursor-pointer"
                  >
                    click to select
                  </label>
                  .
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            id="resume-input"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={onSelectFile}
            className="hidden"
          />

          {file ? (
            <>
              <Button variant="ghost" size="sm" onClick={clearFile}>
                Remove
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={uploading}
                onClick={() => upload(file)}
              >
                {uploading ? `Uploading ${progress}%` : "Upload"}
              </Button>
            </>
          ) : (
            <label htmlFor="resume-input">
              <Button variant="outline" size="sm" asChild>
                <span>Select</span>
              </Button>
            </label>
          )}
        </div>
      </div>

      {uploading && (
        <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="mt-2 text-xs text-muted-foreground flex justify-between">
        <div>Accepted: PDF, DOC, DOCX • Max {maxSizeMB} MB</div>
        {file && <div>{humanSize(file.size)}</div>}
      </div>
    </div>
  );
}
