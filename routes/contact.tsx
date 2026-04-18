import { Head } from "fresh/runtime";

export default function ContactPage() {
	return (
		<>
			<Head>
				<title>Contact Tejas</title>
				<meta
					name="description"
					content="Contact page coming soon."
				/>
			</Head>

			<main
				id="showcase"
				class="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-24 pt-32 sm:px-8 lg:px-12 lg:pt-36"
			>
				<p class="type-label mb-6 text-primary/75">Get in Touch</p>
				<h1 class="type-headline">Contact</h1>
				<p class="mt-8 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8 md:text-lg">
					This page is coming soon...
				</p>
				{/*<p class="mt-8 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8 md:text-lg">
					Until then, you can contact me via email at{"       "}
					<a
						href="mailto:tejas_adg@icloud.com" >
						tejas_adg@icloud.com
					</a>
				</p>*/}
			</main>
		</>
	);
}
