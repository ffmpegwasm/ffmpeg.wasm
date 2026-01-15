import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import SaveIcon from "@mui/icons-material/Save";
import DeleteIcon from "@mui/icons-material/Delete";
import Paper from '@mui/material/Paper';


export interface Preset {
  id: string;
  name: string;
  description?: string;
  args: string;
  isBuiltIn?: boolean;
}

const BUILT_IN_PRESETS: Preset[] = [
    {
    id: "animated-gif",
    name: "Animated GIF",
    description: "Convert video to animated GIF with optimized colors",
    args: JSON.stringify(["-i", "video.webm", "-vf", "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse", "-loop", "0", "output.gif"], null, 2),
    isBuiltIn: true,
  },
  {
    id: "resize-720p",
    name: "Resize 720p",
    description: "Resize video to 720p (1280x720) resolution",
    args: JSON.stringify(["-i", "video.webm", "-vf", "scale=1280:720", "-c:a", "copy", "output.mp4"], null, 2),
    isBuiltIn: true,
  },
  {
    id: "trim-first-3s",
    name: "Trim first 3s",
    description: "Remove the first 3 seconds from the video",
    args: JSON.stringify(["-i", "video.webm", "-ss", "00:00:03", "-c", "copy", "output.mp4"], null, 2),
    isBuiltIn: true,
  },
  {
    id: "extract-audio",
    name: "Extract Audio",
    description: "Extract audio track from video as MP3",
    args: JSON.stringify(["-i", "video.webm", "-vn", "-acodec", "libmp3lame", "audio.mp3"], null, 2),
    isBuiltIn: true,
  },
  {
    id: "merge-audio",
    name: "Merge Audio",
    description: "Replace video's audio track with another audio file",
    args: JSON.stringify(["-i", "video.webm", "-i", "audio.mp3", "-c:v", "copy", "-map", "0:v:0", "-map", "1:a:0", "output.mp4"], null, 2),
    isBuiltIn: true,
  },
  {
    id: "increase-loudness",
    name: "Increase Loudness",
    description: "Increase volume and normalize audio loudness",
    args: JSON.stringify([
      "-i", "video.webm",
      "-filter_complex", "[0:a]volume=10,loudnorm=I=-14:TP=-1.5:LRA=20[a_out]",
      "-map", "0:v", "-map", "[a_out]",
      "-c:v", "copy",
      "-c:a", "aac", "-b:a", "192k",
      "output.mp4"
    ], null, 2),
    isBuiltIn: true,
  },
];

const STORAGE_KEY = "ffmpeg-custom-presets";

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  p: 4,
};

interface PresetsProps {
  onSelectPreset: (args: string) => void;
  currentArgs: string;
}

export default function Presets({ onSelectPreset, currentArgs }: PresetsProps) {
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCustomPresets(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load custom presets:", e);
      }
    }
  }, []);

  const saveCustomPresets = (presets: Preset[]) => {
    setCustomPresets(presets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  };

  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: Preset = {
      id: `custom-${Date.now()}`,
      name: presetName.trim(),
      description: presetDescription.trim() || undefined,
      args: currentArgs,
      isBuiltIn: false,
    };

    saveCustomPresets([...customPresets, newPreset]);
    setSaveModalOpen(false);
    setPresetName("");
    setPresetDescription("");
  };

  const handleDeletePreset = (id: string) => {
    saveCustomPresets(customPresets.filter((p) => p.id !== id));
  };

  const allPresets = [...BUILT_IN_PRESETS, ...customPresets];

  return (
    <>
    <Paper elevation={1} sx={{ p: 1, mt: 3, mb: 1 }}>
      <Stack spacing={1}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="h3">Presets</Typography>
          <Tooltip title="Save current command as preset">
            <IconButton size="small" onClick={() => setSaveModalOpen(true)}>
              <SaveIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            maxHeight: 100,
            overflowY: "auto",
            p: 1,
          }}
        >
          {allPresets.map((preset) => (
            <Tooltip key={preset.id} title={preset.description || preset.name}>
              <Chip
                label={preset.name}
                onClick={() => onSelectPreset(preset.args)}
                onDelete={preset.isBuiltIn ? undefined : () => handleDeletePreset(preset.id)}
                deleteIcon={<DeleteIcon fontSize="small" />}
                size="small"
                variant={preset.isBuiltIn ? "filled" : "outlined"}
                color={preset.isBuiltIn ? "primary" : "default"}
              />
            </Tooltip>
          ))}
          {allPresets.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No presets available
            </Typography>
          )}
        </Box>
      </Stack>
      </Paper>

      <Modal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        aria-labelledby="save-preset-title"
      >
        <Box sx={modalStyle}>
          <Stack spacing={3}>
            <Typography id="save-preset-title" variant="h6" component="h2">
              Save as Preset
            </Typography>
            <TextField
              label="Preset Name"
              variant="outlined"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Description (optional)"
              variant="outlined"
              value={presetDescription}
              onChange={(e) => setPresetDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <Stack direction="row" justifyContent="flex-end" spacing={1}>
              <Button onClick={() => setSaveModalOpen(false)}>Cancel</Button>
              <Button
                variant="contained"
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
              >
                Save
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
    </>
  );
}
