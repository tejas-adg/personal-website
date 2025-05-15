import Header from "../components/Header.tsx";

export default function Home() {
  return (
      <div class="min-h-screen bg-background-light dark:bg-background-dark transition-colors duration-300">
        {/* HEADER */}
        <Header />

        {/* MAIN CONTENT */}
        <main class="flex flex-col items-center justify-center flex-1">
          <div class="flex flex-col items-center justify-start w-full max-w-screen-lg bg-white/80 dark:bg-card-background-dark/80 rounded-2xl shadow-lg p-8 mt-16">
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
