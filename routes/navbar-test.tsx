import { Head } from "fresh/runtime";

export default function NavbarTestPage() {
  return (
    <>
      <Head>
        <title>Navbar Test</title>
        <meta
          name="description"
          content="A small page for testing the shared navbar."
        />
      </Head>

      <main
        id="showcase"
        class="mx-auto flex min-h-screen max-w-6xl flex-col px-5 pb-24 pt-32 sm:px-8 lg:px-12 lg:pt-36"
      >
        <p class="type-label mb-6 text-primary/75">Shared Navigation Test</p>
        <h1 class="type-headline">Navbar Test</h1>
        <p class="mt-8 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8 md:text-lg">
          This page exists so you can click the shared second nav link and
          confirm the global navbar is rendering consistently across routes.
        </p>
      </main>
    </>
  );
}
