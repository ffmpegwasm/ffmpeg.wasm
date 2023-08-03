import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import CardActions from "@mui/material/CardActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

export default function ActionAreaCard({ img, title, desc, url }) {
  return (
    <Card sx={{ maxWidth: 320 }}>
      <CardMedia
        component="img"
        height="180"
        image={img}
        alt="framework image"
      />
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {desc}
        </Typography>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          color="primary"
          onClick={() => {
            window.open(url, "_blank");
          }}
        >
          Open
        </Button>
      </CardActions>
    </Card>
  );
}
