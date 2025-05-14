import ThemeSwitcher from "../islands/ThemeSwitcher.tsx";

export default function Home() {
  return (
      <div class="min-h-screen bg-[#f1f5f9] dark:bg-[#22223b] transition-colors duration-300">
        {/* HEADER */}
        <header class="w-full flex items-center justify-between px-8 py-4">
          <div class="text-2xl font-bold text-gray-700 dark:text-green-200 select-none">
            Tejas A. M.
          </div>
          <ThemeSwitcher />
        </header>

        {/* MAIN CONTENT */}
        <main class="flex flex-col items-center justify-center flex-1">
          <div class="w-full max-w-lg bg-white/80 dark:bg-[#181828]/80 rounded-2xl shadow-lg p-8 mt-16">
            <h1 class="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 text-left">
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
