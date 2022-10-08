import React from "react";
import MuiThemeProvider from "../MuiThemeProvider";
import IconButton, { IconButtonProps } from "@mui/material/IconButton";

export default function ThemedIconButton(props: IconButtonProps) {
  return (
    <MuiThemeProvider>
      <IconButton {...props} />
    </MuiThemeProvider>
  );
}
