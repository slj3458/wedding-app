// src/components/PhotoUpload.jsx
import React, { useState } from "react";
import { API } from "../config"; // ADD THIS LINE

const PhotoUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];

    if (file) {
      // Check file type
      if (!file.type.startsWith("image/")) {
        setMessage({ type: "error", text: "Please select an image file" });
        return;
      }

      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setMessage({
          type: "error",
          text: "File too large. Maximum size is 10MB",
        });
        return;
      }

      setSelectedFile(file);
      setMessage({ type: "", text: "" });

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle upload
  const handleUpload = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setMessage({ type: "error", text: "Please select a photo first" });
      return;
    }

    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", selectedFile);
      if (caption) formData.append("caption", caption);
      if (uploadedBy) formData.append("uploaded_by", uploadedBy);

      // Send to backend
      const response = await fetch(API.GALLERY_UPLOAD, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      await response.json();

      // Success! Clear the form
      setMessage({ type: "success", text: "✓ Photo uploaded successfully!" });
      setSelectedFile(null);
      setPreview(null);
      setCaption("");
      setUploadedBy("");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({
        type: "error",
        text: "Failed to upload photo. Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  // Clear selection
  const handleClear = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption("");
    setMessage({ type: "", text: "" });
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Share Your Photos</h2>

      <form onSubmit={handleUpload} style={styles.form}>
        {/* File input */}
        <div style={styles.uploadArea}>
          <input
            type="file"
            id="photo-input"
            accept="image/*"
            onChange={handleFileSelect}
            style={styles.fileInput}
          />
          <label htmlFor="photo-input" style={styles.fileLabel}>
            {preview ? (
              <img src={preview} alt="Preview" style={styles.preview} />
            ) : (
              <div style={styles.placeholder}>
                <span style={styles.uploadIcon}>📸</span>
                <p style={styles.uploadText}>Click to select a photo</p>
                <p style={styles.uploadHint}>or drag and drop</p>
              </div>
            )}
          </label>
        </div>

        {/* Preview info */}
        {selectedFile && (
          <div style={styles.fileInfo}>
            <p style={styles.fileName}>📄 {selectedFile.name}</p>
            <button
              type="button"
              onClick={handleClear}
              style={styles.clearButton}
            >
              ✕ Remove
            </button>
          </div>
        )}

        {/* Caption input */}
        <div style={styles.inputGroup}>
          <label htmlFor="caption" style={styles.label}>
            Caption (optional)
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption to your photo..."
            style={styles.textarea}
            rows="3"
            maxLength="200"
          />
        </div>

        {/* Name input */}
        <div style={styles.inputGroup}>
          <label htmlFor="name" style={styles.label}>
            Your Name (optional)
          </label>
          <input
            type="text"
            id="name"
            value={uploadedBy}
            onChange={(e) => setUploadedBy(e.target.value)}
            placeholder="Enter your name..."
            style={styles.input}
            maxLength="50"
          />
        </div>

        {/* Upload button */}
        <button
          type="submit"
          disabled={!selectedFile || uploading}
          style={{
            ...styles.uploadButton,
            ...((!selectedFile || uploading) && styles.uploadButtonDisabled),
          }}
        >
          {uploading ? "Uploading..." : "📤 Upload Photo"}
        </button>

        {/* Message display */}
        {message.text && (
          <div
            style={{
              ...styles.message,
              ...(message.type === "success"
                ? styles.messageSuccess
                : styles.messageError),
            }}
          >
            {message.text}
          </div>
        )}
      </form>
    </div>
  );
};

// Styles
const styles = {
  container: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "32px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  title: {
    fontSize: "24px",
    color: "#333",
    marginBottom: "20px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  uploadArea: {
    position: "relative",
    width: "100%",
  },
  fileInput: {
    display: "none",
  },
  fileLabel: {
    display: "block",
    width: "100%",
    minHeight: "200px",
    border: "2px dashed #ccc",
    borderRadius: "8px",
    cursor: "pointer",
    overflow: "hidden",
    transition: "border-color 0.2s",
  },
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "200px",
    padding: "20px",
  },
  uploadIcon: {
    fontSize: "48px",
    marginBottom: "12px",
  },
  uploadText: {
    fontSize: "16px",
    color: "#666",
    margin: "8px 0 4px 0",
  },
  uploadHint: {
    fontSize: "14px",
    color: "#999",
    margin: 0,
  },
  preview: {
    width: "100%",
    height: "auto",
    maxHeight: "300px",
    objectFit: "contain",
  },
  fileInfo: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    backgroundColor: "#f5f5f5",
    borderRadius: "6px",
  },
  fileName: {
    fontSize: "14px",
    color: "#666",
    margin: 0,
  },
  clearButton: {
    background: "none",
    border: "none",
    color: "#f44336",
    cursor: "pointer",
    fontSize: "14px",
    padding: "4px 8px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#555",
  },
  input: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  textarea: {
    padding: "10px 12px",
    fontSize: "14px",
    border: "1px solid #ddd",
    borderRadius: "6px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
  },
  uploadButton: {
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    backgroundColor: "#667eea",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    marginTop: "8px",
  },
  uploadButtonDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  message: {
    padding: "12px",
    borderRadius: "6px",
    fontSize: "14px",
    textAlign: "center",
  },
  messageSuccess: {
    backgroundColor: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb",
  },
  messageError: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb",
  },
};

export default PhotoUpload;
