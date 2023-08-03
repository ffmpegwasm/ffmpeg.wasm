import React from "react";
import Stack from "@mui/material/Stack";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import HelpIcon from "@mui/icons-material/HelpOutline";
import Tooltip from "@mui/material/Tooltip";

interface CoreSwitcherProps {
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CoreSwitcher({ checked, onChange }: CoreSwitcherProps) {
  return (
    <>
      <Stack direction="row" justifyContent="flex-end">
        <FormGroup>
          <FormControlLabel
            control={<Switch checked={checked} onChange={onChange} />}
            label="Use Multithreading"
            disabled={typeof SharedArrayBuffer !== "function"}
          />
        </FormGroup>
        <Tooltip title="Multi-threaded core is faster, but unstable and not supported by all browsers.">
          <IconButton aria-label="help" size="small">
            <HelpIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </>
  );
}
