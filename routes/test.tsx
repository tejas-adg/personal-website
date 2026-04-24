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
        class="mx-auto max-w-6xl min-h-dvh px-5 pb-24 pt-32 sm:px-8 lg:px-12 lg:pt-36"
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
          {/* after:absolute after:left-0 after:bottom-[-2px] after:h-[2px] after:w-full after:bg-primary/30 after:scale-x-0 after:origin-center after:transition-transform after:duration-300 after:ease-[var(--app-ease-standard)] data-[active=true]:after:scale-x-100 */}
          <a className="relative inline-block before:absolute before:-inset-1 before:block before:-skew-y-3 before:bg-pink-500 before:-z-10">
            Home
          </a>

          <blockquote class="text-center text-2xl font-semibold text-gray-900 italic dark:text-white">
            When you look
            <span class="relative inline-block before:absolute before:-inset-1 before:block before:-skew-y-3 before:bg-pink-500">
              <span class="relative text-white dark:text-gray-950">
                annoyed
              </span>
            </span>
            all the time, people think that you're busy.
          </blockquote>
        </div>
      </main>
    </>
  );
});
