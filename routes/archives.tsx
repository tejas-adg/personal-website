import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

export default define.page(function ArchivesPage(_) {
	return (
		<>
			<Head>
				<title>Tejas'sArchives</title>
				<meta
					name="description"
					content="A small page for testing the shared navbar."
				/>
			</Head>

			<main
				id="showcase"
				class="mx-auto flex max-w-6xl min-h-screen flex-col px-5 pb-24 pt-32 sm:px-8 lg:px-12 lg:pt-36"
			>
				<p class="type-label mb-6 text-primary/75">Shared Navigation Test</p>
				<h1 class="type-headline">Archives</h1>
				<p class="mt-8 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8 md:text-lg">
					This page exists so you can click the shared second nav link and
					confirm the global navbar is rendering consistently across routes.
				</p>
				<p class="mt-8 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8 md:text-lg">
					For now ... 😈
				</p>
			</main>
		</>
	);
});
