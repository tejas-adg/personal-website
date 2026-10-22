import { defineConfig, type Plugin } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

/** Keep protected bytes beside server code, outside Fresh's public snapshot. */
function privateAsterAssets(): Plugin {
  let source = "";
  let output = "";
  return {
    name: "private-aster-assets",
    apply: "build",
    applyToEnvironment: (environment) =>
      environment.config.consumer === "server",
    configResolved(config) {
      source = `${config.root}/private/aster`;
      const serverOutput = config.environments.ssr.build.outDir;
      output = `${
        serverOutput.startsWith("/")
          ? serverOutput
          : `${config.root}/${serverOutput}`
      }/private/aster`;
    },
    async writeBundle() {
      // Do not use emitFile or ?url imports: Fresh publishes SSR manifest
      // assets in its client output. Ordinary copying keeps this server-only.
      try {
        await Deno.remove(output, { recursive: true });
      } catch (error) {
        if (!(error instanceof Deno.errors.NotFound)) throw error;
      }
      await Deno.mkdir(output, { recursive: true });
      for await (const file of Deno.readDir(source)) {
        if (!file.isFile) {
          throw new Error("Private assets must be ordinary files");
        }
        await Deno.copyFile(`${source}/${file.name}`, `${output}/${file.name}`);
      }
    },
  };
}

export default defineConfig({
  plugins: [fresh(), tailwindcss(), privateAsterAssets()],
  server: {
    fs: {
      // Preserve Vite's default sensitive-file exclusions and additionally
      // stop its development /@fs endpoint from exposing private screenshots.
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/private/**"],
    },
  },
});
