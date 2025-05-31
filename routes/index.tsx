import Header from "../components/Header.tsx";

export default function Home() {
	return (
		<div class="min-h-screen bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-100 my-colors-transition">
			{/* HEADER */}
			<Header />

			{/* MAIN CONTENT */}
			<main class="flex flex-col items-center justify-center flex-1">
				<div class="flex flex-col items-center justify-start min-w-[722px] w-1/2 max-w-screen-lg rounded-2xl shadow-lg dark:shadow-lg p-8 mt-16 dark:bg-slate-900">
					<h1 class="text-xl font-semibold mb-4 text-left">
						Welcome to my personal website
					</h1>
					<div class="text-4xl font-extrabold text-green-700 dark:text-green-300 mb-2 text-left">
						Website under Construction 🚧👷‍♂️🛠️
					</div>
				</div>
			</main>
		</div>
	);
}
