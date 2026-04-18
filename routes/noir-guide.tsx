import { Head } from "fresh/runtime";
import { ambientImage, exhibitionImage } from "../components/urls.ts";

const footerLinks = [
	{ label: "Journal", href: "#voice" },
	{ label: "Curated", href: "#fragments" },
	{ label: "Inquiry", href: "#footer" },
];

const paletteSwatches = [
	{
		name: "Surface",
		hex: "#180f23",
		description: "Intentional void",
		panelClass:
			"bg-background text-on-surface border border-outline-variant/15",
	},
	{
		name: "Lume",
		hex: "#d0bcff",
		description: "Primary glow",
		panelClass: "bg-primary text-on-primary",
	},
	{
		name: "Vapor",
		hex: "#c4c1fb",
		description: "Secondary accent",
		panelClass: "bg-secondary text-on-secondary",
	},
	{
		name: "Deep",
		hex: "#2f0075",
		description: "Container pulse",
		panelClass: "bg-primary-container text-on-primary-container",
	},
];

const interactionFacts = [
	{ label: "Hover Easing", value: "Cubic Bezier (0.4, 0, 0.2, 1)" },
	{ label: "Elevation Blur", value: "40px - 60px" },
	{ label: "Glass Backdrop", value: "Blur-xl (20px)" },
];

function SectionHeading(
	{ id, title, index }: { id: string; title: string; index: string },
) {
	return (
		<div
			id={id}
			class="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
		>
			<h2 class="type-subheadline italic">{title}</h2>
			<span class="type-label text-outline">{index}</span>
		</div>
	);
}

export default function NoirGuideRoute() {
	return (
		<>
			<Head>
				<title>Aetheric Noir Showcase</title>
				<meta
					name="description"
					content="Aetheric Noir theme showcase for the Fresh personal website."
				/>
			</Head>

			<div class="relative min-h-screen overflow-x-clip bg-background text-on-background selection:bg-primary/30">
				<div
					class="pointer-events-none absolute inset-0"
					aria-hidden="true"
				>
					<div class="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(ellipse_50%_25%_at_50%_0%,#251736_0%,#180F23_100%)]"/>
					{/*<div class="absolute left-[-9rem] top-[42rem] h-[24rem] w-[24rem] rounded-full bg-primary-container/18 blur-3xl" />
					<div class="absolute right-[-10rem] top-[76rem] h-[28rem] w-[28rem] rounded-full bg-secondary/8 blur-3xl" />*/}
				</div>

				<main
					id="showcase"
					class="relative mx-auto flex max-w-6xl flex-col px-5 pb-24 pt-32 sm:px-8 lg:px-12 lg:pt-36"
				>
					<header class="max-w-4xl">
						<p class="type-label mb-6 text-primary/75">Nocturnal System</p>
						<h1 class="type-headline">Aetheric Noir</h1>
						<p class="mt-8 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8 md:text-lg">
							A nocturnal gallery experience shaped by luminous accents,
							architectural stillness, and editorial restraint. This showcase
							exercises the palette, typography, controls, and material layering
							that will anchor the blog’s first public presentation.
						</p>
					</header>

					<section class="mt-24 sm:mt-32">
						<SectionHeading
							id="palette"
							title="The Lunar Tones"
							index="Section 01 / Palette"
						/>

						<div class="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
							{paletteSwatches.map((swatch, index) => (
								<article
									key={swatch.name}
									class={`group relative min-h-[13rem] overflow-hidden rounded-xl p-5 shadow-surface transition duration-500 ease-standard hover:-translate-y-1 hover:shadow-nav-elevated ${swatch.panelClass} `}
								>
									<div class="absolute right-5 top-5 h-12 w-12 rounded-full bg-white/10 blur-2xl" />
									<div class="relative flex h-full flex-col justify-end">
										<p class="type-label text-current opacity-70">
											{swatch.description}
										</p>
										<h3 class="mt-3 font-headline text-3xl italic">
											{swatch.name}
										</h3>
										<p class="mt-2 font-body text-sm opacity-80">
											{swatch.hex}
										</p>
									</div>
								</article>
							))}
						</div>
					</section>

					<section class="mt-24 sm:mt-32">
						<SectionHeading
							id="voice"
							title="Editorial Voice"
							index="Section 02 / Type"
						/>

						<div class="space-y-10">
							<div class="max-w-5xl">
								<p class="type-label mb-4 text-primary/75">
									Newsreader Display
								</p>
								<h3 class="font-headline text-[clamp(2.8rem,6vw,5rem)] italic leading-[0.94] tracking-[-0.04em] text-on-surface">
									The quick brown fox rises through the velvet quiet.
								</h3>
							</div>

							<div class="max-w-4xl">
								<p class="type-label mb-4 text-primary/75">
									Newsreader Medium
								</p>
								<h4 class="type-subheadline italic">
									Whispered aesthetics in a digital void.
								</h4>
							</div>

							<div class="max-w-3xl">
								<p class="type-label mb-4 text-primary/75">Manrope Body</p>
								<p class="type-body text-on-surface-variant">
									Designed for thoughtful reading and slower discovery, the
									interface leans on spacing, tonal layering, and a controlled
									luminous accent. Every module should feel deliberate,
									editorial, and slightly cinematic without losing clarity.
								</p>
							</div>
						</div>
					</section>

					<section class="mt-24 sm:mt-32">
						<SectionHeading
							id="controls"
							title="The Luminous Pulse"
							index="Section 03 / Controls"
						/>

						<div class="rounded-xl bg-surface-container-low p-5 shadow-surface sm:p-8 lg:p-10">
							<div class="grid gap-6 lg:grid-cols-3">
								<div class="rounded-xl bg-surface-container-lowest/65 p-6">
									<p class="type-label mb-5 text-primary/75">Primary Action</p>
									<button
										type="button"
										class="btn-primary text-base sm:text-lg"
									>
										Enter the Gallery
									</button>
									<p class="mt-5 text-sm italic text-outline">
										Diagonal glow from Lume into the deep violet pulse of the
										container accent.
									</p>
								</div>

								<div class="rounded-xl bg-surface-container-lowest/65 p-6">
									<p class="type-label mb-5 text-primary/75">
										Secondary Action
									</p>
									<button
										type="button"
										class="btn-secondary text-base sm:text-lg"
									>
										View Archives
									</button>
									<p class="mt-5 text-sm italic text-outline">
										Ghost border treatment with a restrained surface tint and
										luminous hover response.
									</p>
								</div>

								<div class="rounded-xl bg-surface-container-lowest/65 p-6">
									<p class="type-label mb-5 text-primary/75">Ghost Action</p>
									<button
										type="button"
										class="btn-ghost rounded-none border-0 px-0 py-0"
									>
										Skip Exploration
									</button>
									<p class="mt-5 text-sm italic text-outline">
										Text-only navigation for low-pressure movement through the
										story.
									</p>
								</div>
							</div>
						</div>
					</section>

					<section class="mt-24 sm:mt-32">
						<SectionHeading
							id="fragments"
							title="Material Fragments"
							index="Section 04 / Components"
						/>

						<div class="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
							<article class="card-surface p-4 sm:p-5 lg:p-6">
								<div class="overflow-hidden rounded-lg bg-surface-container-highest">
									<img
										src={exhibitionImage}
										alt="Abstract obsidian sculpture with luminous rim lighting."
										loading="lazy"
										decoding="async"
										class="media-muted h-64 w-full object-cover sm:h-72"
									/>
								</div>

								<div class="mt-6">
									<p class="type-label mb-3 text-primary/75">
										Exhibition Vol. I
									</p>
									<h3 class="font-headline text-3xl italic text-on-surface">
										Shadows &amp; Synthesis
									</h3>
									<p class="mt-4 max-w-md text-base leading-7 text-on-surface-variant">
										A study in digital materiality where obsidian forms, soft
										lume, and measured typography create a slow architectural
										read.
									</p>
								</div>

								<div class="mt-8 flex items-center gap-4 text-sm text-outline">
									<span>2024 / Digital</span>
									<span class="h-1 w-1 rounded-full bg-outline-variant" />
									<span>4k Rendition</span>
								</div>
							</article>

							<div class="flex flex-col gap-6">
								<section class="rounded-xl bg-surface-container-lowest/80 p-6 shadow-surface backdrop-blur-glass">
									<p class="type-label mb-6 text-primary/75">
										Interaction Logic
									</p>
									<div class="space-y-5">
										{interactionFacts.map((fact) => (
											<div
												key={fact.label}
												class="flex items-center justify-between gap-4 text-sm sm:text-base"
											>
												<span class="text-on-surface-variant">
													{fact.label}
												</span>
												<span class="text-primary">{fact.value}</span>
											</div>
										))}
									</div>
								</section>

								<article class="relative min-h-[22rem] overflow-hidden rounded-xl bg-surface-container-high shadow-nav-elevated sm:min-h-[26rem]">
									<img
										src={ambientImage}
										alt="Night sky with a luminous violet nebula."
										loading="lazy"
										decoding="async"
										class="media-muted absolute inset-0 h-full w-full object-cover"
									/>
									<div class="overlay-gradient absolute inset-0" />
									<div class="absolute inset-x-0 bottom-0 p-6">
										<p class="type-label mb-3 text-primary-fixed/80">
											Ambient Texture
										</p>
										<h3 class="font-headline text-2xl italic text-on-surface">
											Astral Traverse
										</h3>
										<p class="mt-2 max-w-xs text-sm leading-6 text-on-surface-variant">
											Light behaves like memory here: diffused, precise, and
											always slightly out of reach.
										</p>
									</div>
								</article>
							</div>
						</div>
					</section>
				</main>

				<footer id="footer" class="footer-divider relative bg-background/90">
					<div class="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12">
						<p class="text-sm italic text-primary/80">
							© 2026 Tejas Adagoor. Crafted in aetheric shadow.
						</p>

						<div class="flex flex-wrap items-center gap-6">
							{footerLinks.map((link) => (
								<a
									key={link.label}
									href={link.href}
									class="type-label text-outline transition duration-300 ease-standard hover:text-on-surface"
								>
									{link.label}
								</a>
							))}
						</div>

						<p class="type-label text-primary/50">v1.0.0</p>
					</div>
				</footer>
			</div>
		</>
	);
}
