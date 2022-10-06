import * as React from "react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import styles from "./styles.module.css";

interface CoreSelectorProps {
  option: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => any;
  onSubmit: () => any;
}
export default function CoreSelector({
  option,
  onChange,
  onSubmit,
}: CoreSelectorProps) {
  return (
    <Container className={styles.margin}>
      <Container className={styles.margin}>
        <FormControl>
          <FormLabel id="core-selector">Select a Core Option</FormLabel>
          <RadioGroup
            aria-labelledby="core-selector"
            name="core-selector"
            value={option}
            onChange={onChange}
          >
            <FormControlLabel
              value="core"
              control={<Radio />}
              label="Core (Slower, but stable)"
            />
            <FormControlLabel
              value="core-mt"
              disabled={typeof SharedArrayBuffer !== "function"}
              control={<Radio />}
              label="Core Multi-threaded (Faster, but lower compatibility and unstable)"
            />
          </RadioGroup>
        </FormControl>
      </Container>
      <Container>
        <Button variant="contained" onClick={onSubmit}>
          Load
        </Button>
      </Container>
    </Container>
  );
}
