import { type PageProps } from "$fresh/server.ts";
import { initInputDetector } from "../utils/InputMethodSignal.ts";
if (typeof window !== "undefined") initInputDetector();

export default function App({ Component }: PageProps) {
	return (
		<html>
			<head>
				{/* Insert the script to set dark class before CSS loads */}
				<script>
					{`
          (function() {
            try {
              var dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              if (dark) document.documentElement.classList.add('dark');
              else document.documentElement.classList.remove('dark');
            } catch (e) {}
          })();
        `}
				</script>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Tejas's Website</title>
				<link rel="stylesheet" href="/styles.css" />
			</head>
			<body>
				<Component />
			</body>
		</html>
	);
}
