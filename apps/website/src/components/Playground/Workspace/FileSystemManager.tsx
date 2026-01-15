import React, { useState, ChangeEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Modal from "@mui/material/Modal";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import FolderIcon from "@mui/icons-material/Folder";
import RefreshIcon from "@mui/icons-material/Refresh";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import UploadIcon from "@mui/icons-material/Upload";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MoreButton from "./MoreButton";
import { Node } from "./types";

interface FileSystemManagerProps {
  path: string;
  nodes: Node[];
  oldName: string;
  newName: string;
  renameOpen: boolean;
  selectedFile: string | null;
  waveformUrl: string | null;
  waveformLoading: boolean;
  onNewNameChange: () => (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onCloseRenameModal: () => () => Promise<void>;
  onFileUpload: (
    isText: boolean
  ) => (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDirClick: (name: string) => () => Promise<void>;
  onFileClick: (name: string) => (option: string) => Promise<void>;
  onFileSelect: (name: string) => Promise<void>;
  onDirCreate: (name: string) => () => Promise<void>;
  onRename: (old_name: string, new_name: string) => () => Promise<void>;
  onRefresh: () => Promise<void>;
  onLoadSamples: () => Promise<void>;
}

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  p: 4,
};

export const options = [
  { text: "Rename", key: "rename" },
  { text: "Download", key: "download" },
  { text: "Download as Text File", key: "download-text" },
  { text: "Delete", key: "delete" },
];

export default function FileSystemManager({
  path = "/",
  nodes = [],
  oldName = "",
  newName = "",
  renameOpen = false,
  selectedFile = null,
  waveformUrl = null,
  waveformLoading = false,
  onNewNameChange = () => () => Promise.resolve(),
  onCloseRenameModal = () => () => Promise.resolve(),
  onFileUpload = () => () => Promise.resolve(),
  onFileClick = () => () => Promise.resolve(),
  onFileSelect = () => Promise.resolve(),
  onDirClick = () => () => Promise.resolve(),
  onDirCreate = () => () => Promise.resolve(),
  onRename = () => () => Promise.resolve(),
  onRefresh = () => Promise.resolve(),
  onLoadSamples = () => Promise.resolve(),
}: FileSystemManagerProps) {
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [dirName, setDirName] = useState("");
  const handleNewFolderModalOpen = () => setNewFolderOpen(true);
  const handleNewFolderModalClose = () => setNewFolderOpen(false);

  return (
    <>
      <Paper variant="outlined" style={{ padding: 8, height: "100%" }}>
        <Stack justifyContent="space-between" style={{ height: "100%" }}>
          <>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="h6" component="h2">File System:</Typography>
              <Box>
                <Tooltip title="Upload a media file">
                  <IconButton
                    aria-label="upload-media-file"
                    component="label"
                    size="small"
                  >
                    <input
                      hidden
                      multiple
                      type="file"
                      onChange={onFileUpload(false)}
                    />
                    <UploadFileIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Upload a text file">
                  <IconButton
                    onClick={() => {}}
                    aria-label="upload-text"
                    component="label"
                    size="small"
                  >
                    <input
                      hidden
                      multiple
                      type="file"
                      onChange={onFileUpload(true)}
                    />
                    <UploadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Create a new folder">
                  <IconButton
                    onClick={() => {
                      setDirName("");
                      handleNewFolderModalOpen();
                    }}
                    aria-label="create-a-new-folder"
                    size="small"
                  >
                    <CreateNewFolderIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Refresh directory">
                  <IconButton
                    onClick={onRefresh}
                    aria-label="fresh"
                    size="small"
                  >
                    <RefreshIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Stack>
            <Typography>{`Path: ${path}`}</Typography>
            <List style={{ height: 480, overflowX: "auto" }}>
              {nodes.map(({ name, isDir }, index) =>
                isDir ? (
                  <ListItemButton key={index} onClick={onDirClick(name)}>
                    <ListItemIcon>
                      <FolderIcon />
                    </ListItemIcon>
                    <ListItemText primary={name} />
                  </ListItemButton>
                ) : (
                  <Box key={index}>
                    <ListItem
                      sx={{
                        backgroundColor: selectedFile === name ? "action.selected" : "transparent",
                        borderRadius: 1,
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: selectedFile === name ? "action.selected" : "action.hover",
                        },
                      }}
                      secondaryAction={
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <ExpandMoreIcon
                            sx={{
                              transform: selectedFile === name ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s",
                              color: "action.active",
                            }}
                          />
                          <MoreButton
                            options={options}
                            onItemClick={onFileClick(name)}
                          />
                        </Stack>
                      }
                      onClick={() => onFileSelect(name)}
                    >
                      <ListItemIcon>
                        <InsertDriveFileIcon />
                      </ListItemIcon>
                      <ListItemText primary={name} />
                    </ListItem>
                    <Collapse in={selectedFile === name} timeout="auto" unmountOnExit>
                      <Box
                        sx={{
                          px: 2,
                          py: 1,
                          backgroundColor: "background.default",
                          borderLeft: "3px solid",
                          borderColor: "primary.main",
                          ml: 2,
                          mr: 1,
                          mb: 1,
                        }}
                      >
                        {waveformLoading ? (
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="center"
                            spacing={1}
                            sx={{ py: 2 }}
                          >
                            <CircularProgress size={20} />
                            <Typography variant="body2" color="text.secondary">
                              Generating waveform...
                            </Typography>
                          </Stack>
                        ) : waveformUrl ? (
                          <Box
                            component="img"
                            src={waveformUrl}
                            alt="Audio waveform"
                            sx={{
                              width: "100%",
                              height: "auto",
                              display: "block",
                              borderRadius: 1,
                            }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                            No waveform available for this file
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                )
              )}
            </List>
          </>
          <Button onClick={onLoadSamples}>Load Sample Files</Button>
        </Stack>
      </Paper>
      <Modal
        open={newFolderOpen}
        onClose={handleNewFolderModalClose}
        aria-labelledby="new-folder-name"
        aria-describedby="new-folder-name-description"
      >
        <Box sx={modalStyle}>
          <Stack spacing={4}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              Folder Name:
            </Typography>
            <TextField
              id="outlined-basic"
              label="my-folder"
              variant="outlined"
              value={dirName}
              onChange={(event) => setDirName(event.target.value)}
            />
            <Stack direction="row" justifyContent="flex-end">
              <Button onClick={handleNewFolderModalClose}>Cancel</Button>
              <Button
                variant="contained"
                onClick={() => {
                  onDirCreate(dirName);
                  handleNewFolderModalClose();
                }}
              >
                Create
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
      <Modal
        open={renameOpen}
        onClose={onCloseRenameModal()}
        aria-labelledby="new-name"
        aria-describedby="new-name-description"
      >
        <Box sx={modalStyle}>
          <Stack spacing={4}>
            <Typography id="modal-modal-title" variant="h6" component="h2">
              New Name:
            </Typography>
            <TextField
              id="outlined-basic"
              label="my-file"
              variant="outlined"
              value={newName}
              onChange={onNewNameChange()}
            />
            <Stack direction="row" justifyContent="flex-end">
              <Button onClick={onCloseRenameModal()}>Cancel</Button>
              <Button
                variant="contained"
                onClick={onRename(oldName, newName)}
              >
                Rename
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
    </>
  );
}
