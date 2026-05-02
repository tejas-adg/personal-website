import { useSignal } from "@preact/signals";
import { Head } from "fresh/runtime";
import Counter from "../islands/Counter.tsx";

export default function AtelierTestPage() {
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
        class="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-24 pt-32 sm:px-8 lg:px-12 lg:pt-36"
      >
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <img
            class="my-6"
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
}
