import { useSignal } from "@preact/signals";
import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import Counter from "../islands/Counter.tsx";

export default define.page(function Home(ctx) {
  const count = useSignal(3);

  console.log("Shared value " + ctx.state.shared);

  return (
    <>
      <Head>
        <title>Tejas's Website 😊</title>
      </Head>
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <img
          class="my-6"
          src="/profile_photo_face.jpg"
          width="128"
          height="128"
          alt="the Fresh logo: a sliced lemon dripping with juice"
        />
        <h1 class="text-4xl font-bold">Welcome to my website</h1>
        <p class="mt-8 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8 md:text-lg">
					The construction is almost done! {/*This is the landing page for my personal website built with Deno Fresh. The shared navbar should have a real destination to point at now, and the counter below is a simple test of interactivity with Preact Signals. Feel free to explore the other pages and check back later for more content as I continue to build out the site!*/}
				</p>
      </div>
      </>
  );
});
