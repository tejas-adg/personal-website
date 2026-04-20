import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

export default define.page(function Home(_) {

  return (
    <>
      <Head>
        <title>Tejas's Website 😊</title>
      </Head>
      <main class="mx-auto flex max-w-6xl min-h-screen flex-col items-center px-5 pb-24 pt-32 sm:px-8 lg:px-12 lg:pt-36">
        <img
          class="mb-6"
          src="/profile_photo_face.jpg"
          width="128"
          height="128"
          alt="the Fresh logo: a sliced lemon dripping with juice"
        />
        <h1 class="text-4xl font-bold">Welcome to my website</h1>
        <p class="mt-8 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8 md:text-lg">
					The construction is almost done! {/*This is the landing page for my personal website built with Deno Fresh. The shared navbar should have a real destination to point at now, and the counter below is a simple test of interactivity with Preact Signals. Feel free to explore the other pages and check back later for more content as I continue to build out the site!*/}
				</p>
      </main>
      </>
  );
});
