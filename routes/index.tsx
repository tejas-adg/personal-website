import { Head } from "fresh/runtime";
import { define } from "../utils.ts";

export default define.page(function Home(ctx) {
  console.log("Shared value " + ctx.state.shared);

  return (
    <>
      <Head>
        <title>Tejas's Website 😊</title>
      </Head>
      <main class="home-hero" aria-labelledby="home-heading">
        <img
          class="home-hero-portrait"
          src="/profile_photo.png"
          width="558"
          height="558"
          alt="Tejas wearing sunglasses at a scenic overlook"
        />
        <h1 id="home-heading" class="home-hero-heading font-bold">
          Welcome to my website
        </h1>
        <p class="home-hero-description">
          The construction is almost done!
        </p>
      </main>
    </>
  );
});
