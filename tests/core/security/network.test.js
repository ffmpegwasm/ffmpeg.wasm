// The core is built with --disable-network: untrusted arguments or playlists
// can't make it open connections (it used to emulate sockets with WebSockets).
import { expect } from "vitest";
import { test } from "../../helpers/core.js";
import { exec } from "../../helpers/run.js";

test.for(["http://127.0.0.1:9/x.mp4", "tcp://127.0.0.1:9", "rtmp://127.0.0.1/x"])("refuses %s", async (url, { core }) => {
  const { ret, log } = await exec(core, "-i", url, "-f", "null", "-");
  expect(ret).to.not.equal(0);
  expect(log).to.match(/Protocol not found|No such file|Invalid argument/);
});
