import { type PageProps } from "$fresh/server.ts";

export default function App({ Component }: PageProps) {
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
				<link rel="stylesheet" href="/styles.css" />
			</head>
			<body>
				<Component />
			</body>
		</html>
	);
}
