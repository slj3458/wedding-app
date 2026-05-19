import React, { useRef, useState, useEffect } from "react";
import { API } from "../config";

const STATES = { IDLE: "idle", CAMERA: "camera", PROCESSING: "processing", RESULT: "result" };

const CaricatureBooth = () => {
  const [state, setState] = useState(STATES.IDLE);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => stopStream();
  }, []);

  useEffect(() => {
    if (state === STATES.CAMERA && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [state]);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const openCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setState(STATES.CAMERA);
    } catch {
      // No camera access (HTTP, denied, unsupported) — fall back to file picker
      inputRef.current?.click();
    }
  };

  const snap = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        stopStream();
        if (blob) processFile(new File([blob], "selfie.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92
    );
  };

  const cancelCamera = () => {
    stopStream();
    setState(STATES.IDLE);
  };

  const processFile = async (file) => {
    setState(STATES.PROCESSING);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(API.CARICATURE_SUBMIT, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`Upload failed (${response.status})`);
      const data = await response.json();
      setResult(data);
      setState(STATES.RESULT);
    } catch (err) {
      console.error("Caricature submit error:", err);
      setError("Something went wrong. Please try again.");
      setState(STATES.IDLE);
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select an image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too large (max 10MB).");
      return;
    }
    setError("");
    processFile(file);
  };

  const reset = () => {
    setState(STATES.IDLE);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🎨 Caricature Booth</h2>
      <p style={styles.subtitle}>
        Take a selfie and we'll turn it into a cartoon keepsake!
      </p>

      {state === STATES.IDLE && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            style={styles.fileInput}
            id="caricature-input"
          />
          <button onClick={openCamera} style={styles.bigButton}>
            📸 Take a Selfie
          </button>
          {error && <div style={styles.error}>{error}</div>}
        </>
      )}

      {state === STATES.CAMERA && (
        <div style={styles.cameraWrap}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={styles.video}
          />
          <div style={styles.cameraActions}>
            <button onClick={snap} style={styles.snapButton}>
              📸 Snap!
            </button>
            <button onClick={cancelCamera} style={styles.secondaryButton}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {state === STATES.PROCESSING && (
        <div style={styles.processing}>
          <div style={styles.spinner} />
          <p>Creating your caricature…</p>
        </div>
      )}

      {state === STATES.RESULT && result && (
        <div style={styles.resultWrap}>
          <img
            src={API.CARICATURE_IMAGE(result.filename)}
            alt="Your caricature"
            style={styles.resultImage}
          />
          <div style={styles.actions}>
            <a
              href={API.CARICATURE_DOWNLOAD(result.filename)}
              style={styles.downloadButton}
              download="wedding-caricature.jpg"
            >
              💾 Download
            </a>
            <button onClick={reset} style={styles.secondaryButton}>
              Try Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "32px 24px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  title: { fontSize: "28px", color: "#333", marginBottom: "8px" },
  subtitle: { color: "#666", marginBottom: "24px" },
  fileInput: {
    position: "absolute",
    width: "1px",
    height: "1px",
    opacity: 0,
    overflow: "hidden",
  },
  bigButton: {
    display: "inline-block",
    padding: "20px 36px",
    fontSize: "20px",
    fontWeight: 600,
    color: "white",
    backgroundColor: "#67074e",
    borderRadius: "12px",
    cursor: "pointer",
    border: "none",
    boxShadow: "0 4px 12px rgba(103,7,78,0.3)",
  },
  cameraWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  video: {
    width: "100%",
    maxWidth: "400px",
    borderRadius: "12px",
    background: "#000",
    transform: "scaleX(-1)",
  },
  cameraActions: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  snapButton: {
    padding: "16px 32px",
    fontSize: "18px",
    fontWeight: 600,
    color: "white",
    backgroundColor: "#67074e",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(103,7,78,0.3)",
  },
  processing: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "40px 0",
  },
  spinner: {
    width: "48px",
    height: "48px",
    border: "4px solid #eee",
    borderTopColor: "#67074e",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  resultWrap: { display: "flex", flexDirection: "column", gap: "20px" },
  resultImage: {
    maxWidth: "100%",
    maxHeight: "520px",
    margin: "0 auto",
    borderRadius: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  downloadButton: {
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: 600,
    color: "white",
    backgroundColor: "#67074e",
    borderRadius: "8px",
    textDecoration: "none",
  },
  secondaryButton: {
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: 600,
    color: "#67074e",
    backgroundColor: "transparent",
    border: "2px solid #67074e",
    borderRadius: "8px",
    cursor: "pointer",
  },
  error: {
    marginTop: "16px",
    padding: "12px",
    color: "#721c24",
    backgroundColor: "#f8d7da",
    border: "1px solid #f5c6cb",
    borderRadius: "6px",
  },
};

export default CaricatureBooth;
