import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

export default define.page(function ExhibitionsPage(_) {
  return (
    <>
      <Head>
        <title>Tejas's Gallery</title>
        <meta
          name="description"
          content="A simple test page for the exhibitions route."
        />
      </Head>

      <main
        id="showcase"
        class="mx-auto flex max-w-6xl min-h-lvh flex-col px-5 pb-24 pt-32 sm:px-8 lg:px-12 lg:pt-36"
      >
        <p class="type-label mb-6 text-primary/75">Route Test</p>
        <h1 class="type-headline">Exhibitions</h1>
        <p class="mt-8 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8 md:text-lg">
          This is a simple landing page for the `/exhibitions` route so the
          shared navbar has a real destination to point at.
        </p>
      </main>
    </>
  );
});
