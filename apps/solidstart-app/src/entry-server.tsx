// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';
import { HttpHeader, HttpStatusCode } from '@solidjs/start';

export default createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang='en'>
        {/*necessary because ffmpeg library uses sharedArrayBuffer */}
        <HttpHeader name='Cross-Origin-Opener-Policy' value='same-origin' />
        <HttpHeader name='Cross-Origin-Embedder-Policy' value='require-corp' />
        <head>
          <meta charset='utf-8' />
          <meta name='viewport' content='width=device-width, initial-scale=1' />
          <link rel='icon' href='/favicon.ico' />
          {assets}
        </head>
        <body>
          <div id='app'>{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));
