import { define } from "../utils.ts";
import { NavBar } from "../components/NavBar.tsx";

export default define.page(function App({ Component }) {
  return (
    <html class="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Tejas's Website</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&family=Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800&display=swap"
        />
        {/*<link rel="stylesheet" href="/styles.css" />*/}
      </head>
      <body>
        <NavBar />
        <div class="pt-25 bg-[radial-gradient(ellipse_50%_25%_at_50%_0%,#251736_0%,#180F23_100%)]" />
        <Component />
      </body>
    </html>
  );
});
