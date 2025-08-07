import React, { useEffect, useState, useRef } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Snackbar,
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Tooltip,
  Fade,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ClearIcon from "@mui/icons-material/Clear";
import { useNavigate } from "react-router-dom";
import Masonry from "react-masonry-css";

const DarkModeToggleButton = ({ darkMode, setDarkMode }) => (
  <Button color="inherit" onClick={() => setDarkMode(!darkMode)} aria-label="Toggle dark mode">
    {darkMode ? "Light Mode" : "Dark Mode"}
  </Button>
);

const randomRotation = () => (Math.random() * 6 - 3).toFixed(2);

const pastelColorsLight = [
  "#FFD8D8", // soft red
  "#FFE6A7", // soft yellow
  "#D6F0F3", // soft cyan
  "#D8E8CB", // soft green
  "#EFD0F9", // soft violet
  "#FFF1E0", // soft peach
];

const darkenColor = (color, amount = 0.3) => {
  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);
  r = Math.floor(r * (1 - amount));
  g = Math.floor(g * (1 - amount));
  b = Math.floor(b * (1 - amount));
  const rr = r.toString(16).padStart(2, "0");
  const gg = g.toString(16).padStart(2, "0");
  const bb = b.toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
};

const Home = ({ user, handleLogout, darkMode, setDarkMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const newNoteInputRef = useRef(null);

  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [snackbarAction, setSnackbarAction] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [notesLoading, setNotesLoading] = useState(true);
  const [openNote, setOpenNote] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [editTags, setEditTags] = useState("");
  const [noteColors, setNoteColors] = useState({});
  const [noteRotations, setNoteRotations] = useState({});
  const [activeTagFilter, setActiveTagFilter] = useState(null);

  // For undo deletion
  const [lastDeletedNote, setLastDeletedNote] = useState(null);
  const undoTimerRef = useRef(null);

  useEffect(() => {
    let newColors = {};
    let newRotations = {};
    notes.forEach((note) => {
      if (noteColors[note.id]) newColors[note.id] = noteColors[note.id];
      else {
        const baseColor = pastelColorsLight[Math.floor(Math.random() * pastelColorsLight.length)];
        newColors[note.id] = darkMode ? darkenColor(baseColor) : baseColor;
      }
      if (noteRotations[note.id] !== undefined) newRotations[note.id] = noteRotations[note.id];
      else newRotations[note.id] = randomRotation();
    });
    setNoteColors(newColors);
    setNoteRotations(newRotations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, darkMode]);

  const onLogoutClick = async () => {
    try {
      await handleLogout();
      navigate("/welcome");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const showSnackbar = (msg, severity = "success", action = null) => {
    setSnackbarMsg(msg);
    setSnackbarSeverity(severity);
    setSnackbarAction(action);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
    setSnackbarAction(null);
  };

  const tagsArray = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "notes"), where("uid", "==", user.uid), orderBy("created", "desc"));

    setNotesLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notesArr = [];
        querySnapshot.forEach((doc) => {
          notesArr.push({ id: doc.id, ...doc.data() });
        });
        setNotes(notesArr);
        setNotesLoading(false);
      },
      (error) => {
        console.error("Firestore snapshot listener error:", error);
        showSnackbar("Failed to load notes. Check permissions and indexes.", "error");
        setNotesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleAddNote = async () => {
    if (noteText.trim() === "") {
      showSnackbar("Please enter some text before adding a note", "warning");
      return;
    }
    try {
      await addDoc(collection(db, "notes"), {
        uid: user.uid,
        text: noteText.trim(),
        tags: tagsArray,
        created: serverTimestamp(),
      });
      setNoteText("");
      setTagsInput("");
      showSnackbar("Note added successfully!", "success");
      newNoteInputRef.current?.focus();
      setActiveTagFilter(null); // clear filter
    } catch (error) {
      console.error("Failed to add note error:", error);
      showSnackbar("Failed to add note.", "error");
    }
  };

  // Undo delete logic
  const handleDeleteNote = async (id) => {
    try {
      // Find note before deleting to allow undo
      const deletedNote = notes.find((n) => n.id === id);
      if (!deletedNote) return;

      await deleteDoc(doc(db, "notes", id));
      setLastDeletedNote(deletedNote);

      // Show snackbar with undo action
      showSnackbar("Note deleted!", "info", (
        <Button color="inherit" size="small" onClick={handleUndoDelete} aria-label="Undo delete">
          UNDO
        </Button>
      ));

      // Reset undo after 5 seconds
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
      undoTimerRef.current = setTimeout(() => setLastDeletedNote(null), 5000);
    } catch (error) {
      console.error("Failed to delete note error:", error);
      showSnackbar("Failed to delete note.", "error");
    }
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedNote) return;
    try {
      await setDoc(doc(db, "notes", lastDeletedNote.id), lastDeletedNote);
      setLastDeletedNote(null);
      showSnackbar("Note restored!", "success");
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    } catch (error) {
      console.error("Failed to restore note:", error);
      showSnackbar("Failed to restore note.", "error");
    }
  };

  const handleOpenNote = (note) => {
    setOpenNote(note);
    setEditMode(false);
    setEditText(note.text);
    setEditTags(note.tags ? note.tags.join(", ") : "");
  };

  const handleCloseNote = () => {
    setOpenNote(null);
    setEditMode(false);
  };

  const handleStartEdit = () => setEditMode(true);

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditText(openNote.text);
    setEditTags(openNote.tags ? openNote.tags.join(", ") : "");
  };

  const handleSaveEdit = async () => {
    if (editText.trim() === "") {
      showSnackbar("Note text cannot be empty!", "warning");
      return;
    }
    try {
      await setDoc(
        doc(db, "notes", openNote.id),
        {
          text: editText.trim(),
          tags: editTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
          updated: serverTimestamp(),
        },
        { merge: true }
      );

      setOpenNote((prev) => ({
        ...prev,
        text: editText.trim(),
        tags: editTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
      }));
      setEditMode(false);
      showSnackbar("Note updated!", "success");
      setActiveTagFilter(null);
    } catch (error) {
      console.error("Failed to update note:", error);
      showSnackbar("Failed to update note.", "error");
    }
  };

  const handleCopyNote = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showSnackbar("Note copied to clipboard!", "success");
    } catch {
      showSnackbar("Failed to copy note text.", "error");
    }
  };

  const onTagClick = (tag) => {
    setSearchText("");
    setActiveTagFilter(tag);
  };

  const stringAvatar = (name) => {
    if (!name) return {};
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    return { children: initials };
  };

  // Format timestamps with relative time
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    if (diffSeconds < 60) return "just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} min ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} hr ago`;
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredNotes = notes.filter((note) => {
    if (activeTagFilter) {
      return note.tags?.some((tag) => tag.toLowerCase() === activeTagFilter.toLowerCase());
    }
    if (searchText.trim() === "") return true;
    const textMatch = note.text.toLowerCase().includes(searchText.toLowerCase());
    const tagsMatch = note.tags?.some((tag) =>
      tag.toLowerCase().includes(searchText.toLowerCase())
    );
    return textMatch || tagsMatch;
  });

  const breakpointColumnsObj = {
    default: 5,
    1600: 4,
    1100: 3,
    700: 2,
    500: 1,
  };

  return (
    <>
      {/* Masonry CSS */}
      <style>{`
        .my-masonry-grid {
          display: flex;
          margin-left: -16px;
          width: auto;
        }
        .my-masonry-grid_column {
          padding-left: 16px;
          background-clip: padding-box;
        }
        .my-masonry-grid_column > div {
          margin-bottom: 16px;
          transition: all 0.3s ease;
        }

        /* Tag badge */
        .tag-badge {
          display: inline-block;
          background-color: ${darkMode ? "#555" : "#ddd"};
          color: ${darkMode ? "#eee" : "#333"};
          border-radius: 12px;
          padding: 4px 10px;
          font-size: 0.75rem;
          margin-right: 6px;
          cursor: pointer;
          user-select: none;
          transition: background-color 0.2s;
        }
        .tag-badge:hover {
          background-color: ${darkMode ? "#777" : "#bbb"};
        }
      `}</style>

      <AppBar position="static">
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <img
              src="/logo192.png"
              alt="Logo"
              style={{ width: 32, height: 32, display: "block" }}
              draggable={false}
            />
            <Typography variant="h6" component="div">
              NoteTaker App
            </Typography>
          </Box>

          <DarkModeToggleButton darkMode={darkMode} setDarkMode={setDarkMode} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: 2 }}>
            <Avatar {...stringAvatar(user?.email || "U")} />
            <Typography variant="body1" sx={{ whiteSpace: "nowrap" }}>
              {user?.email}
            </Typography>
            <IconButton
              color="inherit"
              onClick={onLogoutClick}
              title="Logout"
              aria-label="Logout current user"
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4, maxWidth: "1500px" }}>
        <Typography variant="h4" gutterBottom>
          Add a Note
        </Typography>

        <Box sx={{ maxWidth: 600, mx: "auto", mt: 3, position: "relative" }}>
          <TextField
            inputRef={newNoteInputRef}
            label="Search notes"
            value={activeTagFilter ? activeTagFilter : searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setActiveTagFilter(null);
            }}
            variant="outlined"
            margin="normal"
            fullWidth
            placeholder="Search notes or click a tag below to filter"
            aria-label="Search notes"
            InputProps={{
              endAdornment: (searchText || activeTagFilter) && (
                <IconButton
                  aria-label="Clear search"
                  onClick={() => {
                    setSearchText("");
                    setActiveTagFilter(null);
                    newNoteInputRef.current?.focus();
                  }}
                  size="small"
                  sx={{ cursor: "pointer" }}
                >
                  <ClearIcon />
                </IconButton>
              ),
            }}
          />

          <TextField
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            label="New Note"
            variant="outlined"
            margin="normal"
            fullWidth
            multiline
            rows={3}
            placeholder="Type your note here"
            aria-label="New note text"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleAddNote();
              }
            }}
          />

          <TextField
            label="Tags (comma separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            variant="outlined"
            margin="normal"
            fullWidth
            placeholder="e.g., Work, Ideas, Personal"
            aria-label="Tags for new note"
          />

          <Button
            variant="contained"
            sx={{ mt: 1 }}
            onClick={handleAddNote}
            disabled={noteText.trim() === ""}
            aria-label="Add note"
          >
            Add 
          </Button>

          {activeTagFilter && (
            <Button
              size="small"
              color="secondary"
              onClick={() => setActiveTagFilter(null)}
              sx={{ mt: 1 }}
              aria-label="Clear tag filter"
            >
              Clear filter: {activeTagFilter}
            </Button>
          )}
        </Box>

        {notesLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <CircularProgress aria-label="Loading notes" />
          </Box>
        ) : filteredNotes.length === 0 ? (
          <Typography align="center" sx={{ mt: 6, color: "text.secondary" }}>
            No notes found.
          </Typography>
        ) : (
          <Masonry
            breakpointCols={breakpointColumnsObj}
            className="my-masonry-grid"
            columnClassName="my-masonry-grid_column"
            style={{ marginTop: 16 }}
          >
            {filteredNotes.map((note) => {
              const rotation = noteRotations[note.id] || 0;
              const timestampToShow = note.updated || note.created;
              const isEdited = !!note.updated;
              const bgColor = noteColors[note.id] || (darkMode ? "#444" : "#fff9c4");

              return (
                <Fade key={note.id} in timeout={400}>
                  <Card
                    onClick={() => handleOpenNote(note)}
                    elevation={8}
                    sx={{
                      cursor: "pointer",
                      padding: 2,
                      paddingRight: 4, // Reserve space top-right for icons
                      paddingBottom: 4.5,
                      backgroundColor: bgColor,
                      color: darkMode ? theme.palette.text.primary : undefined,
                      boxShadow: darkMode
                        ? "0 4px 10px rgba(0,0,0,0.3)"
                        : "4px 4px 10px rgba(0,0,0,0.2)",
                      borderRadius: 2,
                      position: "relative",
                      userSelect: "none",
                      transform: `rotate(${rotation}deg)`,
                      transition: "transform 0.3s",
                      "&:hover": { transform: `rotate(0deg) scale(1.05)` },
                      wordBreak: "break-word",
                      minHeight: 140,
                      maxHeight: 450,
                      overflow: "hidden",
                      display: "flex",
                      flexDirection: "column",
                      outline: "none",
                      "&:focus-visible": {
                        boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.7)}`,
                        transform: "rotate(0deg) scale(1.05)",
                      },
                    }}
                    onMouseDown={(e) => e.preventDefault()}
                    tabIndex={0}
                    aria-label={`Note: ${note.text.slice(0, 30)}${note.text.length > 30 ? "..." : ""}`}
                  >
                    <CardContent
                      sx={{
                        p: 0,
                        pt:1.5,
                        pb: 4,
                        pr: 0,             // Less padding because scrollbar overlays
                        flex: 1,
                        overflowY: "overlay",   // Overlay scrollbar for no shrinking
                        scrollbarWidth: "thin",
                        scrollbarColor: darkMode ? "rgba(255,255,255,0.4) transparent" : "rgba(0,0,0,0.3) transparent",
                        "&::-webkit-scrollbar": {
                          width: "8px",
                        },
                        "&::-webkit-scrollbar-track": {
                          background: "transparent",
                        },
                        "&::-webkit-scrollbar-thumb": {
                          backgroundColor: darkMode ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.25)",
                          borderRadius: "10px",
                        },
                        "&:hover::-webkit-scrollbar-thumb": {
                          backgroundColor: darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)",
                        },
                        "&:last-child": { pb: 0 },
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ whiteSpace: "pre-wrap" }}
                        gutterBottom
                        title={note.text}
                      >
                        {note.text}
                      </Typography>

                      {note.tags && note.tags.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          {note.tags.map((tag) => (
                            <Box
                              key={tag}
                              component="span"
                              className="tag-badge"
                              onClick={(e) => {
                                e.stopPropagation();
                                onTagClick(tag);
                              }}
                              aria-label={`Filter notes by tag ${tag}`}
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onTagClick(tag);
                                }
                              }}
                            >
                              {tag}
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>

                    {/* Timestamp with tooltip */}
                    {timestampToShow && (
                      <Tooltip
                        title={
                          timestampToShow.toDate
                            ? timestampToShow.toDate().toString()
                            : new Date(timestampToShow).toString()
                        }
                        placement="top"
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            position: "absolute",
                            bottom: 8,
                            right: 8,
                            opacity: 0.5,
                            fontStyle: "italic",
                            userSelect: "none",
                            cursor: "default",
                          }}
                          tabIndex={-1}
                        >
                          {isEdited ? "Edited: " : "Created: "}
                          {formatTimestamp(timestampToShow)}
                        </Typography>
                      </Tooltip>
                    )}

                    {/* Copy note button */}
                    <Tooltip title="Copy note text to clipboard">
                      <IconButton
                        aria-label="Copy note text"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyNote(note.text);
                        }}
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 40,
                          bgcolor: darkMode ? alpha("#fff", 0.1) : alpha("#000", 0.05),
                          "&:hover": {
                            bgcolor: darkMode ? alpha("#fff", 0.2) : alpha("#000", 0.1),
                          },
                        }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>

                    {/* Delete note button */}
                    <Tooltip title="Delete note">
                      <IconButton
                        color="error"
                        aria-label="Delete note"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note.id);
                        }}
                        sx={{
                          position: "absolute",
                          top: 4,
                          right: 4,
                          bgcolor: darkMode ? alpha("#fff", 0.1) : alpha("#000", 0.05),
                          "&:hover": {
                            bgcolor: darkMode ? alpha("#fff", 0.2) : alpha("#000", 0.1),
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Card>
                </Fade>
              );
            })}
          </Masonry>
        )}
      </Container>

      {/* Note Modal */}
      <Dialog
        open={!!openNote}
        onClose={handleCloseNote}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { bgcolor: theme.palette.background.paper } }}
      >
        <DialogTitle
          sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
        >
          {editMode ? "Edit Note" : "View Note"}
          <IconButton onClick={handleCloseNote} aria-label="Close note dialog">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ minHeight: 150, maxHeight: 300, overflowY: "auto" }}>
          {editMode ? (
            <>
              <TextField
                label="Edit Note"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                fullWidth
                multiline
                minRows={4}
                margin="normal"
                autoFocus
                aria-label="Edit note text"
              />
              <TextField
                label="Tags (comma separated)"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                fullWidth
                margin="normal"
                aria-label="Edit note tags"
              />
            </>
          ) : (
            <>
              <Typography variant="body1" sx={{ whiteSpace: "pre-line", mb: 2 }}>
                {openNote?.text}
              </Typography>
              {openNote?.tags && openNote.tags.length > 0 && (
                <Typography variant="caption" color="text.secondary">
                  Tags: {openNote?.tags.join(", ")}
                </Typography>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          {editMode ? (
            <>
              <Button onClick={handleCancelEdit} aria-label="Cancel editing note">
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} variant="contained" aria-label="Save edited note">
                Save
              </Button>
            </>
          ) : (
            <Button startIcon={<EditIcon />} onClick={handleStartEdit} variant="outlined" aria-label="Edit note">
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        aria-live="polite"
      >
        <Alert severity={snackbarSeverity} onClose={handleSnackbarClose} sx={{ width: "100%" }} action={snackbarAction}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Home;
