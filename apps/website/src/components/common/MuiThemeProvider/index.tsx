import React from "react";
import { useColorMode } from "@docusaurus/theme-common";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const lightTheme = createTheme({});
const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function MuiThemeProvider(props: any) {
  const { colorMode } = useColorMode();
  return (
    <ThemeProvider
      theme={colorMode === "dark" ? darkTheme : lightTheme}
      {...props}
    />
  );
}
