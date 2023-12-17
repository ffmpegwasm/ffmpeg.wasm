'use client'

import NoSSRWrapper from "./NoSSRWrapper";
import Home from "./Home";

export default function Page() {
  return <NoSSRWrapper><Home /></NoSSRWrapper>
}
