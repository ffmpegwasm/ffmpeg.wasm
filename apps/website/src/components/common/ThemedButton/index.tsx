import React from "react";
import MuiThemeProvider from "../MuiThemeProvider";
import Button, { ButtonProps } from "@mui/material/Button";

export default function ThemedButton(props: ButtonProps) {
  return (
    <MuiThemeProvider>
      <Button {...props} />
    </MuiThemeProvider>
  );
}
