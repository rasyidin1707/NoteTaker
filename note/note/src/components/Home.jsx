import React, { useEffect, useState } from "react";
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
  alpha,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LogoutIcon from "@mui/icons-material/Logout";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";

const DarkModeToggleButton = ({ darkMode, setDarkMode }) => (
  <Button color="inherit" onClick={() => setDarkMode(!darkMode)}>
    {darkMode ? "Light Mode" : "Dark Mode"}
  </Button>
);

const randomRotation = () => (Math.random() * 6 - 3).toFixed(2);

// Pastel colors for light mode sticky notes:
const pastelColorsLight = [
  "#FFD8D8", // soft red
  "#FFE6A7", // soft yellow
  "#D6F0F3", // soft cyan
  "#D8E8CB", // soft green
  "#EFD0F9", // soft violet
  "#FFF1E0", // soft peach
];

// For dark mode, we'll create darker versions programmatically
// This function darkens a hex color by reducing brightness
const darkenColor = (color, amount = 0.3) => {
  // amount is fraction (0.0 - 1.0) to darken
  // convert hex to rgb
  let r = parseInt(color.slice(1, 3), 16);
  let g = parseInt(color.slice(3, 5), 16);
  let b = parseInt(color.slice(5, 7), 16);
  // reduce each channel by amount
  r = Math.floor(r * (1 - amount));
  g = Math.floor(g * (1 - amount));
  b = Math.floor(b * (1 - amount));
  // convert back to hex
  const rr = r.toString(16).padStart(2, "0");
  const gg = g.toString(16).padStart(2, "0");
  const bb = b.toString(16).padStart(2, "0");
  return `#${rr}${gg}${bb}`;
};

const Home = ({ user, handleLogout, darkMode, setDarkMode }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [searchText, setSearchText] = useState("");
  const [notesLoading, setNotesLoading] = useState(true);

  const [openNote, setOpenNote] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [editTags, setEditTags] = useState("");

  // Generate a random pastel background color for each note,
  // store in a ref like object keyed by note ID to be consistent
  const [noteColors, setNoteColors] = useState({});

  // Assign colors to new notes when notes data changes
  useEffect(() => {
    let newColors = {};
    notes.forEach((note) => {
      if (noteColors[note.id]) {
        // Keep existing color
        newColors[note.id] = noteColors[note.id];
      } else {
        // Pick random pastel color
        const baseColor =
          pastelColorsLight[Math.floor(Math.random() * pastelColorsLight.length)];
        const color = darkMode ? darkenColor(baseColor) : baseColor;
        newColors[note.id] = color;
      }
    });
    setNoteColors(newColors);
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

  const showSnackbar = (msg, severity = "success") => {
    setSnackbarMsg(msg);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const tagsArray = tagsInput
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notes"),
      where("uid", "==", user.uid),
      orderBy("created", "desc")
    );

    setNotesLoading(true);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        let notesArr = [];
        querySnapshot.forEach((doc) => {
          notesArr.push({ id: doc.id, ...doc.data() });
        });
        setNotes(notesArr);
        setNotesLoading(false);
      },
      (error) => {
        console.error("Firestore snapshot listener error:", error);
        showSnackbar(
          "Failed to load notes. Check permissions and indexes.",
          "error"
        );
        setNotesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleAddNote = async () => {
    if (noteText.trim() === "") return;
    try {
      await addDoc(collection(db, "notes"), {
        uid: user.uid,
        text: noteText,
        tags: tagsArray,
        created: serverTimestamp(),
      });

      setNoteText("");
      setTagsInput("");
      showSnackbar("Note added successfully!", "success");
    } catch (error) {
      console.error("Failed to add note error:", error);
      showSnackbar("Failed to add note.", "error");
    }
  };

  const handleDeleteNote = async (id) => {
    try {
      await deleteDoc(doc(db, "notes", id));
      showSnackbar("Note deleted!", "info");
    } catch (error) {
      console.error("Failed to delete note error:", error);
      showSnackbar("Failed to delete note.", "error");
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

  const handleStartEdit = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditText(openNote.text);
    setEditTags(openNote.tags ? openNote.tags.join(", ") : "");
  };

  const handleSaveEdit = async () => {
    try {
      await setDoc(
        doc(db, "notes", openNote.id),
        {
          text: editText,
          tags: editTags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0),
          updated: serverTimestamp(),
        },
        { merge: true }
      );

      setOpenNote((prev) => ({
        ...prev,
        text: editText,
        tags: editTags.split(",").map((t) => t.trim()).filter((t) => t.length > 0),
      }));
      setEditMode(false);
      showSnackbar("Note updated!", "success");
    } catch (error) {
      console.error("Failed to update note:", error);
      showSnackbar("Failed to update note.", "error");
    }
  };

  const stringAvatar = (name) => {
    if (!name) return {};
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    return {
      children: `${initials}`,
    };
  };

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
    const textMatch = note.text.toLowerCase().includes(searchText.toLowerCase());
    const tagsMatch = note.tags?.some((tag) =>
      tag.toLowerCase().includes(searchText.toLowerCase())
    );
    return textMatch || tagsMatch;
  });

  return (
    <>
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
              aria-label="logout"
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Add a Note
        </Typography>

        <Box sx={{ maxWidth: 600, mx: "auto", mt: 3 }}>
          <TextField
            label="Search notes"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            variant="outlined"
            margin="normal"
            fullWidth
          />

          <TextField
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            label="New Note"
            helperText={noteText.trim() === "" ? "Please enter some text" : ""}
            error={noteText.trim() === ""}
            variant="outlined"
            margin="normal"
            fullWidth
          />

          <TextField
            label="Tags (comma separated)"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            variant="outlined"
            margin="normal"
            fullWidth
          />

          <Button
            variant="contained"
            sx={{ mt: 1 }}
            onClick={handleAddNote}
            disabled={noteText.trim() === ""}
          >
            Add
          </Button>
        </Box>

        {notesLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
            <CircularProgress />
          </Box>
        ) : filteredNotes.length === 0 ? (
          <Typography align="center" sx={{ mt: 6, color: "text.secondary" }}>
            No notes found.
          </Typography>
        ) : (
          <Box
            component="section"
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 2,
              justifyContent: "center",
            }}
          >
            {filteredNotes.map((note) => {
              const rotation = randomRotation();
              const timestampToShow = note.updated || note.created;
              const isEdited = !!note.updated;
              const bgColor = noteColors[note.id] || (darkMode ? "#444" : "#fff9c4");

              return (
                <Card
                  key={note.id}
                  onClick={() => handleOpenNote(note)}
                  elevation={8}
                  sx={{
                    cursor: "pointer",
                    padding: 2,
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
                    maxHeight: 450, // max height for very long notes; scroll inside text
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <CardContent
                    sx={{
                      p: 0,
                      flex: 1,
                      overflowY: "auto",
                      "&:last-child": { pb: 0 },
                    }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: "pre-wrap",
                      }}
                      gutterBottom
                      title={note.text}
                    >
                      {note.text}
                    </Typography>
                    {note.tags && note.tags.length > 0 && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Tags: {note.tags.join(", ")}
                      </Typography>
                    )}
                  </CardContent>

                  {/* Timestamp at bottom-right */}
                  {timestampToShow && (
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
                      }}
                    >
                      {isEdited ? "Edited: " : "Created: "}
                      {formatTimestamp(timestampToShow)}
                    </Typography>
                  )}

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
                      bgcolor: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                      "&:hover": {
                        bgcolor: darkMode
                          ? "rgba(255,255,255,0.2)"
                          : "rgba(0,0,0,0.1)",
                      },
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>

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
          <IconButton onClick={handleCloseNote}>
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
              />
              <TextField
                label="Tags (comma separated)"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                fullWidth
                margin="normal"
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
              <Button onClick={handleCancelEdit}>Cancel</Button>
              <Button onClick={handleSaveEdit} variant="contained">
                Save
              </Button>
            </>
          ) : (
            <Button startIcon={<EditIcon />} onClick={handleStartEdit} variant="outlined">
              Edit
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbarSeverity} onClose={handleSnackbarClose} sx={{ width: "100%" }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Home;
