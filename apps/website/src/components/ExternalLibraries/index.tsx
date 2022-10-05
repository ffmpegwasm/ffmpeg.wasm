import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

interface LibraryItem {
  title: string;
  desc: string;
  img: string;
  isBlackBackground?: boolean;
}

const libs: LibraryItem[] = [
  {
    title: "x264",
    desc: "H.264 Codec",
    img: require("@site/static/img/libs/x264.png").default,
    isBlackBackground: true,
  },
  {
    title: "x265",
    desc: "H.265 codec",
    img: require("@site/static/img/libs/x265.webp").default,
  },
  {
    title: "libvpx",
    desc: "VP8/VP9 codec",
    img: require("@site/static/img/libs/libvpx.png").default,
  },
  {
    title: "theora",
    desc: "OGV codec",
    img: require("@site/static/img/libs/theora.png").default,
  },
  {
    title: "lame",
    desc: "MP3 codec",
    img: require("@site/static/img/libs/lame.gif").default,
  },
  {
    title: "vorbis",
    desc: "OGG codec",
    img: require("@site/static/img/libs/vorbis.png").default,
  },
  {
    title: "opus",
    desc: "OPUS codec",
    img: require("@site/static/img/libs/opus.png").default,
  },
  {
    title: "freetype2",
    desc: "Font file renderer",
    img: require("@site/static/img/libs/freetype.png").default,
  },
  {
    title: "libass",
    desc: "subtitle renderer",
    img: require("@site/static/img/libs/freetype.png").default,
  },
  {
    title: "libwebp",
    desc: "WEBP codec",
    img: require("@site/static/img/libs/webp.png").default,
  },
];

function Library({ title, desc, img, isBlackBackground = false }: LibraryItem) {
  return (
    <div className={clsx("col col--2")}>
      <div className="text--center">
        <img
          src={img}
          className={clsx(
            styles.libraryImg,
            isBlackBackground && styles.blackBackground
          )}
        />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{desc}</p>
      </div>
    </div>
  );
}

export default function ExternalLibraries(): JSX.Element {
  return (
    <section className={styles.libraries}>
      <div className="container">
        <h1 className="text--center">External Libraries</h1>
        <h4 className="text--center">
          {" "}
          ffmpeg.wasm is built with common external libraries, and more of
          libraries to be added!
        </h4>
        <div className="row">
          {libs.map((props, idx) => (
            <Library key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
