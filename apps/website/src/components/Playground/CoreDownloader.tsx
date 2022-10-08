import * as React from "react";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import LinearProgressWithLabel from "@site/src/components/common/LinearProgressWithLabel";
import { CORE_SIZE } from "./const";

export default function CoreDownloader({ url, received }) {
  const total = CORE_SIZE[url];
  return (
    <Container>
      <Typography>{`Downloading ${url}`}</Typography>
      <Typography>{`(${received} / ${total} bytes)`}</Typography>
      <LinearProgressWithLabel value={(received / total) * 100} />
    </Container>
  );
}
