// src/components/Guestbook.jsx
import React, { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { API } from "../config"; // ADD THIS LINE

const Guestbook = ({ isAdmin = false, adminToken = null }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState({ type: "", text: "" });

  // Connect to WebSocket for real-time updates
  const { messages } = useWebSocket();

  // Fetch initial entries when component loads
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const response = await fetch(API.GUESTBOOK_ENTRIES);
        const data = await response.json();
        setEntries(data.entries);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching guestbook entries:", error);
        setLoading(false);
      }
    };
    fetchEntries();
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];

      if (latestMessage.type === "new_guestbook_entry") {
        setEntries((prev) => {
          const exists = prev.some((e) => e.id === latestMessage.data.id);
          return exists ? prev : [latestMessage.data, ...prev];
        });
      } else if (
        latestMessage.type === "guestbook_deleted" ||
        latestMessage.type === "guestbook_hidden"
      ) {
        setEntries((prev) =>
          prev.filter((entry) => entry.id !== latestMessage.data.id),
        );
      }
    }
  }, [messages]);

  // Function to submit a new entry
  const handleSubmit = async (event) => {
    event.preventDefault();

    // Validation
    if (!name.trim()) {
      setNotification({ type: "error", text: "Please enter your name" });
      return;
    }

    if (!message.trim()) {
      setNotification({ type: "error", text: "Please enter a message" });
      return;
    }

    setSubmitting(true);
    setNotification({ type: "", text: "" });

    try {
      const response = await fetch(API.GUESTBOOK_SUBMIT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          message: message.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit entry");
      }

      // Success! Clear the form
      setNotification({
        type: "success",
        text: "✓ Your message has been added!",
      });
      setName("");
      setMessage("");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setNotification({ type: "", text: "" });
      }, 3000);
    } catch (error) {
      console.error("Submit error:", error);
      setNotification({
        type: "error",
        text: "Failed to submit. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Admin function to perform actions
  const adminAction = async (entryId, action) => {
    if (!isAdmin || !adminToken) return;

    const confirmMessage =
      action === "delete"
        ? "Are you sure you want to permanently delete this entry?"
        : action === "hide"
          ? "Hide this entry from guests?"
          : "Unhide this entry?";

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(API.ADMIN_ACTION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          item_id: entryId,
          item_type: "guestbook",
          action: action,
        }),
      });

      if (!response.ok) {
        throw new Error("Admin action failed");
      }

      // Remove from local state if deleted or hidden
      if (action === "delete" || action === "hide") {
        setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      }
    } catch (error) {
      console.error("Admin action error:", error);
      alert("Failed to perform action. Please try again.");
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading guestbook...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>✨ Guest Book ✨</h2>
      <p style={styles.subtitle}>
        Leave your wishes and memories for the happy couple
      </p>

      {/* Entry form */}
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label htmlFor="guestbook-name" style={styles.label}>
            Your Name
          </label>
          <input
            type="text"
            id="guestbook-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            style={styles.input}
            maxLength="50"
            disabled={submitting}
          />
        </div>

        <div style={styles.inputGroup}>
          <label htmlFor="guestbook-message" style={styles.label}>
            Your Message
          </label>
          <textarea
            id="guestbook-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your wishes, advice, or favorite memory..."
            style={styles.textarea}
            rows="4"
            maxLength="500"
            disabled={submitting}
          />
          <div style={styles.charCount}>{message.length}/500 characters</div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            ...styles.submitButton,
            ...(submitting && styles.submitButtonDisabled),
          }}
        >
          {submitting ? "Sending..." : "💌 Sign Guestbook"}
        </button>

        {/* Notification */}
        {notification.text && (
          <div
            style={{
              ...styles.notification,
              ...(notification.type === "success"
                ? styles.notificationSuccess
                : styles.notificationError),
            }}
          >
            {notification.text}
          </div>
        )}
      </form>

      {/* Entries list */}
      <div style={styles.entriesContainer}>
        <h3 style={styles.entriesTitle}>Messages ({entries.length})</h3>

        {entries.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No messages yet. Be the first to sign the guestbook!</p>
          </div>
        ) : (
          <div style={styles.entriesList}>
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                style={{
                  ...styles.entry,
                  animationDelay: `${index * 0.05}s`,
                }}
              >
                {/* Admin controls */}
                {isAdmin && (
                  <div style={styles.adminControls}>
                    <button
                      onClick={() => adminAction(entry.id, "hide")}
                      style={styles.adminHideButton}
                      title="Hide entry"
                    >
                      👁️
                    </button>
                    <button
                      onClick={() => adminAction(entry.id, "delete")}
                      style={styles.adminDeleteButton}
                      title="Delete entry permanently"
                    >
                      🗑️
                    </button>
                  </div>
                )}

                <div style={styles.entryHeader}>
                  <span style={styles.entryName}>✍️ {entry.name}</span>
                  <span style={styles.entryDate}>
                    {formatDate(entry.created_at)}
                  </span>
                </div>
                <p style={styles.entryMessage}>{entry.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format dates
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Styles
const styles = {
  container: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "32px",
    marginBottom: "32px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    fontSize: "18px",
    color: "#666",
  },
  title: {
    fontSize: "32px",
    color: "#333",
    textAlign: "center",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    textAlign: "center",
    marginBottom: "32px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingBottom: "32px",
    borderBottom: "2px solid #f0f0f0",
    marginBottom: "32px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#555",
  },
  input: {
    padding: "12px 14px",
    fontSize: "15px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  textarea: {
    padding: "12px 14px",
    fontSize: "15px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    outline: "none",
    resize: "vertical",
    fontFamily: "inherit",
    lineHeight: "1.5",
  },
  charCount: {
    fontSize: "12px",
    color: "#999",
    textAlign: "right",
  },
  submitButton: {
    padding: "14px 24px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    backgroundColor: "#667eea",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s, transform 0.1s",
    marginTop: "8px",
  },
  submitButtonDisabled: {
    backgroundColor: "#ccc",
    cursor: "not-allowed",
  },
  notification: {
    padding: "12px",
    borderRadius: "6px",
    fontSize: "14px",
    textAlign: "center",
    fontWeight: "500",
  },
  notificationSuccess: {
    backgroundColor: "#d4edda",
    color: "#155724",
    border: "1px solid #c3e6cb",
  },
  notificationError: {
    backgroundColor: "#f8d7da",
    color: "#721c24",
    border: "1px solid #f5c6cb",
  },
  entriesContainer: {
    marginTop: "32px",
  },
  entriesTitle: {
    fontSize: "20px",
    color: "#333",
    marginBottom: "20px",
    fontWeight: "600",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#999",
    fontSize: "15px",
  },
  entriesList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  entry: {
    position: "relative", // Added this line
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "12px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    animation: "fadeIn 0.5s ease-in",
  },
  entryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    flexWrap: "wrap",
    gap: "8px",
  },
  entryName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#667eea",
  },
  entryDate: {
    fontSize: "13px",
    color: "#999",
  },
  entryMessage: {
    fontSize: "15px",
    color: "#333",
    lineHeight: "1.6",
    margin: 0,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  adminControls: {
    position: "absolute",
    top: "12px",
    right: "12px",
    display: "flex",
    gap: "6px",
  },
  adminHideButton: {
    padding: "6px 8px",
    fontSize: "14px",
    color: "white",
    backgroundColor: "rgba(255, 152, 0, 0.9)",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "all 0.2s",
  },
  adminDeleteButton: {
    padding: "6px 8px",
    fontSize: "14px",
    color: "white",
    backgroundColor: "rgba(244, 67, 54, 0.9)",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "all 0.2s",
  },
};

export default Guestbook;
