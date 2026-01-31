// src/components/PhotoGallery.jsx
import React, { useState, useEffect } from "react";
import { useWebSocket } from "../hooks/useWebSocket";
import { API } from "../config"; // ADD THIS LINE

const PhotoGallery = ({ isAdmin = false, adminToken = null }) => {
  console.log("PhotoGallery - isAdmin:", isAdmin, "adminToken:", adminToken);
  const [photos, setPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");

  // Connect to WebSocket for real-time updates
  const { messages, isConnected } = useWebSocket("ws://localhost:8000/ws");

  // Fetch initial photos when component loads
  useEffect(() => {
    fetchPhotos();
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];

      if (latestMessage.type === "new_photo") {
        handleNewPhoto(latestMessage.data);
      } else if (latestMessage.type === "photo_liked") {
        handlePhotoLiked(latestMessage.data);
      } else if (
        latestMessage.type === "photo_deleted" ||
        latestMessage.type === "photo_hidden"
      ) {
        // Remove photo from display when admin deletes/hides it
        setPhotos((prev) =>
          prev.filter((photo) => photo.id !== latestMessage.data.id),
        );
      }
    }
  }, [messages]);

  // Apply filtering and sorting whenever photos, searchTerm, or sortBy changes
  useEffect(() => {
    let result = [...photos];

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (photo) =>
          (photo.caption && photo.caption.toLowerCase().includes(search)) ||
          (photo.uploaded_by &&
            photo.uploaded_by.toLowerCase().includes(search)),
      );
    }

    // Sort photos
    switch (sortBy) {
      case "recent":
        result.sort((a, b) => b.id - a.id); // Newest first (by ID)
        break;
      case "oldest":
        result.sort((a, b) => a.id - b.id); // Oldest first
        break;
      case "most_liked":
        result.sort((a, b) => b.likes - a.likes); // Most liked first
        break;
      default:
        break;
    }

    setFilteredPhotos(result);
  }, [photos, searchTerm, sortBy]);

  // Function to fetch photos from backend
  const fetchPhotos = async () => {
    try {
      const response = await fetch(`${API}/gallery/photos`);
      const data = await response.json();
      setPhotos(data.photos);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching photos:", error);
      setLoading(false);
    }
  };

  // ADD THESE TWO FUNCTIONS HERE:
  // Handle new photo from WebSocket
  const handleNewPhoto = (photo) => {
    // Check if photo already exists to avoid duplicates
    const exists = photos.some((p) => p.id === photo.id);
    if (!exists) {
      setPhotos((prev) => [photo, ...prev]);
    }
  };

  // Handle photo liked from WebSocket
  const handlePhotoLiked = (data) => {
    setPhotos((prevPhotos) =>
      prevPhotos.map((photo) =>
        photo.id === data.id ? { ...photo, likes: data.likes } : photo,
      ),
    );
  };

  // Function to like a photo
  const likePhoto = async (photoId) => {
    try {
      await fetch(API.GALLERY_LIKE(photoId), {
        method: "POST",
      });
    } catch (error) {
      console.error("Error liking photo:", error);
    }
  };

  // Function to download a photo
  const downloadPhoto = async (filename, originalFilename) => {
    try {
      const response = await fetch(API.GALLERY_PHOTO(filename));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = originalFilename || filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading photo:", error);
    }
  };

  // Admin function to perform actions
  const adminAction = async (photoId, action) => {
    if (!isAdmin || !adminToken) return;

    const confirmMessage =
      action === "delete"
        ? "Are you sure you want to permanently delete this photo?"
        : action === "hide"
          ? "Hide this photo from guests?"
          : "Unhide this photo?";

    if (!window.confirm(confirmMessage)) return;

    try {
      const response = await fetch(API.ADMIN_ACTION, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          item_id: photoId,
          item_type: "photo",
          action: action,
        }),
      });

      if (!response.ok) {
        throw new Error("Admin action failed");
      }

      // Remove from local state if deleted or hidden
      if (action === "delete" || action === "hide") {
        setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
      }
    } catch (error) {
      console.error("Admin action error:", error);
      alert("Failed to perform action. Please try again.");
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading photos...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Photo Gallery</h1>
        <div style={styles.connectionStatus}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: isConnected ? "#4caf50" : "#f44336",
            }}
          ></span>
          <span style={styles.statusText}>
            {isConnected ? "Live Updates Active" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Controls Section */}
      <div style={styles.controls}>
        {/* Search */}
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="🔍 Search photos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={styles.clearSearch}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort */}
        <div style={styles.sortContainer}>
          <label htmlFor="sort-select" style={styles.sortLabel}>
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={styles.sortSelect}
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="most_liked">Most Liked</option>
          </select>
        </div>
      </div>

      {/* Results count */}
      <div style={styles.resultsInfo}>
        Showing {filteredPhotos.length} of {photos.length} photo
        {photos.length !== 1 ? "s" : ""}
        {searchTerm && (
          <span style={styles.searchInfo}> matching "{searchTerm}"</span>
        )}
      </div>

      <div style={styles.grid}>
        {filteredPhotos.map((photo) => (
          <div key={photo.id} style={styles.photoCard}>
            {/* Admin controls overlay */}
            {isAdmin && (
              <div style={styles.adminOverlay}>
                <button
                  onClick={() => adminAction(photo.id, "hide")}
                  style={styles.adminHideButton}
                  title="Hide photo"
                >
                  👁️ Hide
                </button>
                <button
                  onClick={() => adminAction(photo.id, "delete")}
                  style={styles.adminDeleteButton}
                  title="Delete photo permanently"
                >
                  🗑️ Delete
                </button>
              </div>
            )}

            <div style={styles.imageContainer}>
              <img
                src={API.GALLERY_THUMBNAIL(photo.filename)}
                alt={photo.caption || "Wedding photo"}
                style={styles.image}
                onClick={() =>
                  window.open(API.GALLERY_PHOTO(photo.filename), "_blank")
                }
              />

              {/* Download button overlay */}
              <button
                style={styles.downloadButton}
                onClick={(e) => {
                  e.stopPropagation();
                  downloadPhoto(photo.filename, photo.original_filename);
                }}
                title="Download photo"
              >
                ⬇️
              </button>
            </div>

            {photo.caption && <p style={styles.caption}>{photo.caption}</p>}

            <div style={styles.footer}>
              <span style={styles.uploadedBy}>
                📸 {photo.uploaded_by || "Guest"}
              </span>

              <button
                style={styles.likeButton}
                onClick={() => likePhoto(photo.id)}
                title="Like this photo"
              >
                ❤️ {photo.likes}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPhotos.length === 0 && photos.length > 0 && (
        <div style={styles.empty}>
          <p>No photos match your search. Try different keywords.</p>
          <button
            onClick={() => setSearchTerm("")}
            style={styles.clearSearchButton}
          >
            Clear Search
          </button>
        </div>
      )}

      {photos.length === 0 && (
        <div style={styles.empty}>
          <p>No photos yet. Be the first to share a moment!</p>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "20px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "24px",
    flexWrap: "wrap",
    gap: "12px",
  },
  title: {
    fontSize: "32px",
    //    color: '#333',
    color: "#FFF",
    margin: 0,
  },
  connectionStatus: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  statusDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
  },
  statusText: {
    fontSize: "14px",
    color: "#666",
  },
  loading: {
    textAlign: "center",
    padding: "50px",
    fontSize: "18px",
    color: "#666",
  },
  controls: {
    display: "flex",
    gap: "16px",
    marginBottom: "16px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchContainer: {
    position: "relative",
    flex: "1",
    minWidth: "250px",
  },
  searchInput: {
    width: "100%",
    padding: "10px 36px 10px 12px",
    fontSize: "15px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    outline: "none",
    transition: "border-color 0.2s",
  },
  clearSearch: {
    position: "absolute",
    right: "8px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    fontSize: "18px",
    color: "#999",
    cursor: "pointer",
    padding: "4px 8px",
  },
  sortContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  sortLabel: {
    fontSize: "14px",
    //    color: '#666',
    color: "#FFF",
    fontWeight: "500",
  },
  sortSelect: {
    padding: "10px 12px",
    fontSize: "15px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    backgroundColor: "white",
    cursor: "pointer",
    outline: "none",
  },
  resultsInfo: {
    fontSize: "14px",
    //    color: '#666',
    color: "#FFF",
    marginBottom: "20px",
  },
  searchInfo: {
    fontWeight: "600",
    color: "#667eea",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "20px",
  },
  photoCard: {
    position: "relative",
    border: "1px solid #ddd",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "white",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  imageContainer: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: "300px",
    objectFit: "cover",
    cursor: "pointer",
  },
  downloadButton: {
    position: "absolute",
    top: "8px",
    right: "8px",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    border: "none",
    borderRadius: "6px",
    padding: "8px 12px",
    fontSize: "18px",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
    transition: "background-color 0.2s, transform 0.1s",
    opacity: 0.8,
  },
  caption: {
    padding: "12px",
    margin: 0,
    fontSize: "14px",
    color: "#333",
  },
  footer: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px",
    borderTop: "1px solid #eee",
    backgroundColor: "#f9f9f9",
  },
  uploadedBy: {
    fontSize: "13px",
    color: "#666",
  },
  likeButton: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    padding: "5px 10px",
    borderRadius: "4px",
    transition: "background-color 0.2s",
  },
  empty: {
    textAlign: "center",
    color: "#999",
    padding: "80px 20px",
    fontSize: "16px",
  },
  clearSearchButton: {
    marginTop: "16px",
    padding: "10px 20px",
    fontSize: "14px",
    backgroundColor: "#667eea",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  adminOverlay: {
    position: "absolute",
    top: "8px",
    left: "8px",
    display: "flex",
    gap: "6px",
    zIndex: 10,
  },
  adminHideButton: {
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "600",
    color: "white",
    backgroundColor: "rgba(255, 152, 0, 0.9)",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
  adminDeleteButton: {
    padding: "6px 10px",
    fontSize: "12px",
    fontWeight: "600",
    color: "white",
    backgroundColor: "rgba(244, 67, 54, 0.9)",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
  },
};

export default PhotoGallery;
