import React, { useState, ChangeEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import MoreButton from "./MoreButton";
import { Node } from "./types";

interface FileSystemManagerProps {
  path: string;
  nodes: Node[];
  onFileUpload: (
    isText: boolean
  ) => (event: ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDirClick: (name: string) => () => Promise<void>;
  onFileClick: (name: string) => (option: string) => Promise<void>;
  onDirCreate: (name: string) => () => Promise<void>;
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
  { text: "Download", key: "download" },
  { text: "Download as Text File", key: "download-text" },
  { text: "Delete", key: "delete" },
];

export default function FileSystemManager({
  path = "/",
  nodes = [],
  onFileUpload = () => () => Promise.resolve(),
  onFileClick = () => () => Promise.resolve(),
  onDirClick = () => () => Promise.resolve(),
  onDirCreate = () => () => Promise.resolve(),
  onRefresh = () => Promise.resolve(),
  onLoadSamples = () => Promise.resolve(),
}: FileSystemManagerProps) {
  const [open, setOpen] = useState(false);
  const [dirName, setDirName] = useState("");
  const handleModalOpen = () => setOpen(true);
  const handleModalClose = () => setOpen(false);

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
              <Typography>File System:</Typography>
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
                      handleModalOpen();
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
                  <ListItem
                    key={index}
                    secondaryAction={
                      <MoreButton
                        options={options}
                        onItemClick={onFileClick(name)}
                      />
                    }
                  >
                    <ListItemIcon>
                      <InsertDriveFileIcon />
                    </ListItemIcon>
                    <ListItemText primary={name} />
                  </ListItem>
                )
              )}
            </List>
          </>
          <Button onClick={onLoadSamples}>Load Sample Files</Button>
        </Stack>
      </Paper>
      <Modal
        open={open}
        onClose={handleModalClose}
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
              <Button onClick={handleModalClose}>Cancel</Button>
              <Button
                variant="contained"
                onClick={() => {
                  onDirCreate(dirName);
                  handleModalClose();
                }}
              >
                Create
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Modal>
    </>
  );
}
