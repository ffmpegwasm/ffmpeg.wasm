import MuiThemeProvider from "@site/src/components/common/MuiThemeProvider";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

# Migrating from 0.11.x to 0.12+

As 0.12+ is not backward compatible with 0.11.x, below is a quick mapping
table to transform 0.11.x to 0.12+

<MuiThemeProvider>
    <TableContainer>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell align="center">0.11.x</TableCell>
            <TableCell align="center">0.12+</TableCell>
            <TableCell align="center">Note</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            {"0.11.x": "import { createFFmpeg } from '@ffmpeg/ffmpeg'", "0.12+": "import { FFmpeg } from '@ffmpeg/ffmpeg'", note: ""},
            {"0.11.x": "createFFmpeg()", "0.12+": "new FFmpeg()", note: "argumens of createFFmpeg() is moved to ffmpeg.load()"},
            {"0.11.x": "await ffmpeg.load()", "0.12+": "await ffmpeg.load()", note: ""},
            {"0.11.x": "await ffmpeg.run(...args)", "0.12+": "await ffmpeg.exec([...args])", note: ""},
            {"0.11.x": "ffmpeg.FS.writeFile()", "0.12+": "await ffmpeg.writeFile()", note: ""},
            {"0.11.x": "ffmpeg.FS.readFile()", "0.12+": "await ffmpeg.readFile()", note: ""},
            {"0.11.x": "ffmpeg.exit()", "0.12+": "await ffmpeg.terminate()", note: ""},
            {"0.11.x": "ffmpeg.setLogger()", "0.12+": "ffmpeg.on(\"log\", () => {})", note: ""},
            {"0.11.x": "ffmpeg.setProgress()", "0.12+": "ffmpeg.on(\"progress\", () => {})", note: ""},
            {"0.11.x": "import { fetchFile } from '@ffmpeg/ffmpeg'", "0.12+": "import { fetchFile } from '@ffmpeg/util'", note: ""},
           ].map((row) => (
            <TableRow
              key={row['0.11.x']}
            >
              <TableCell component="th" scope="row">
                {row['0.11.x']}
              </TableCell>
              <TableCell align="left">{row['0.12+']}</TableCell>
              <TableCell align="left">{row.note}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
</MuiThemeProvider>
