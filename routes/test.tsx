import { useSignal } from "@preact/signals";
import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import Counter from "../islands/Counter.tsx";

export default define.page(function AtelierTestPage(_) {
	const count = useSignal(3);
	
	return (
		<>
			<Head>
				<title>Atelier 👨‍💻</title>
				<meta
					name="description"
					content="A simple test page for the atelier route."
				/>
			</Head>

			<main
				id="showcase"
				class="mx-auto max-w-6xl min-h-screen px-5 pb-24 pt-32 sm:px-8 lg:px-12 lg:pt-36"
			>
				<div class="mx-auto flex flex-col items-center justify-center">
								<img
									class="mb-6"
									src="/logo.svg"
									width="128"
									height="128"
									alt="the Fresh logo: a sliced lemon dripping with juice"
								/>
								<h1 class="text-4xl font-bold">Welcome to Fresh</h1>
								<p class="my-4">
									Try updating this message in the
									<code class="mx-2">./routes/index.tsx</code> file, and refresh.
								</p>
								<Counter count={count} />
							</div>
			</main>
		</>
	);
});
