import React from "react";
import clsx from "clsx";
import styles from "./styles.module.css";

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: JSX.Element;
};

const FeatureList: FeatureItem[] = [
  {
    title: "Data Security",
    Svg: require("@site/static/img/safety-icon.svg").default,
    description: (
      <>
        ffmpeg.wasm runs only inside your browser, data security is gaurantee as
        no data is sent to remote server.
      </>
    ),
  },
  {
    title: "Powered by WebAssembly",
    Svg: require("@site/static/img/wasm-logo.svg").default,
    description: (
      <>
        ffmpeg.wasm transpiles <a href="https://ffmpeg.org/">ffmpeg</a> source
        code to WebAssembly code using
        <a href="https://emscripten.org/"> Emscripten</a> to achieve optimal
        performance.
      </>
    ),
  },
  {
    title: "Made with TypeScript",
    Svg: require("@site/static/img/ts-logo-round-512.svg").default,
    description: (
      <>
        ffmpeg.wasm is written in TypeScript to provide great developer
        experience (DX).
      </>
    ),
  },
];

function Feature({ title, Svg, description }: FeatureItem) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): JSX.Element {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
