import React, { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";

const GEMINI_API_KEY_STORAGE = "gemini_api_key";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

interface AskAIDialogProps {
  open: boolean;
  onClose: () => void;
  onCommandGenerated: (command: string) => void;
}

export default function AskAIDialog({
  open,
  onClose,
  onCommandGenerated,
}: AskAIDialogProps) {
  const [apiKey, setApiKey] = useState("");
  const [userRequest, setUserRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    // Load API key from localStorage
    const savedKey = localStorage.getItem(GEMINI_API_KEY_STORAGE);
    if (savedKey) {
      setApiKey(savedKey);
      setShowApiKeyInput(false);
    } else {
      setShowApiKeyInput(true);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem(GEMINI_API_KEY_STORAGE, apiKey.trim());
      setShowApiKeyInput(false);
      setError(null);
    }
  };

  const handleClearApiKey = () => {
    localStorage.removeItem(GEMINI_API_KEY_STORAGE);
    setApiKey("");
    setShowApiKeyInput(true);
  };

  const handleGenerate = async () => {
    if (!apiKey.trim()) {
      setError("Please provide a Gemini API key");
      setShowApiKeyInput(true);
      return;
    }

    if (!userRequest.trim()) {
      setError("Please describe what you want to do");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an FFmpeg command expert. Translate the user's request into an FFmpeg command. Return the command as a JSON array of strings, which are the arguments to pass to ffmpeg.

Examples:

User: "Convert video.webm to mp4"
Response: ["-i", "video.webm", "video.mp4"]

User: "Extract audio from video.mp4 as mp3"
Response: ["-i", "video.mp4", "-vn", "-acodec", "libmp3lame", "audio.mp3"]

User: "Compress video.mp4 to 720p"
Response: ["-i", "video.mp4", "-vf", "scale=-1:720", "-c:v", "libx264", "-crf", "23", "output.mp4"]

User: "Trim video.mp4 from 10 seconds to 30 seconds"
Response: ["-i", "video.mp4", "-ss", "00:00:10", "-to", "00:00:30", "-c", "copy", "trimmed.mp4"]

User: "Create a gif from video.mp4"
Response: ["-i", "video.mp4", "-vf", "fps=10,scale=320:-1:flags=lanczos", "-c:v", "gif", "output.gif"]

Now translate this request:
User: "${userRequest}"
Response:`,
                },
              ],
            },
          ],
          generationConfig: {
            response_mime_type: "application/json",
            response_schema: {
              type: "array",
              items: {
                type: "string",
              },
            },
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || `API request failed: ${response.statusText}`
        );
      }

      const data = await response.json();
      const generatedCommand = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!generatedCommand) {
        throw new Error("No command generated from API");
      }

      // Parse and validate the JSON array
      const commandArray = JSON.parse(generatedCommand);
      if (!Array.isArray(commandArray)) {
        throw new Error("Generated command is not a valid array");
      }

      // Format as pretty JSON
      const formattedCommand = JSON.stringify(commandArray, null, 2);
      onCommandGenerated(formattedCommand);
      setUserRequest("");
      onClose();
    } catch (err) {
      console.error("Error generating command:", err);
      setError(err.message || "Failed to generate command. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ask AI for FFmpeg Command</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {showApiKeyInput ? (
            <>
              <Alert severity="info">
                You need a Gemini API key to use this feature.{" "}
                <Link
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Get one here
                </Link>
              </Alert>
              <TextField
                label="Gemini API Key"
                type="password"
                fullWidth
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
              />
              <Button
                variant="outlined"
                onClick={handleSaveApiKey}
                disabled={!apiKey.trim()}
              >
                Save API Key
              </Button>
            </>
          ) : (
            <Alert severity="success">
              API key saved.{" "}
              <Link
                component="button"
                onClick={handleClearApiKey}
                sx={{ cursor: "pointer" }}
              >
                Clear key
              </Link>
            </Alert>
          )}

          <TextField
            label="What do you want to do?"
            multiline
            rows={4}
            fullWidth
            value={userRequest}
            onChange={(e) => setUserRequest(e.target.value)}
            placeholder="E.g., Convert video.webm to mp4, Extract audio as mp3, Compress to 720p..."
            disabled={loading || showApiKeyInput}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleGenerate}
          variant="contained"
          disabled={loading || !userRequest.trim() || showApiKeyInput}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Generating..." : "Generate Command"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
