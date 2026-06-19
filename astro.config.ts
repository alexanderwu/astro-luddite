import { join } from "node:path"
import { fileURLToPath } from "node:url"
import type { AstroIntegration } from "astro"
import * as pagefindLib from "pagefind"
import { defineConfig } from "astro/config"
import sitemap from "@astrojs/sitemap"
import { satteri } from "@astrojs/markdown-satteri"
import {
  blockExpressiveCode,
  inlineExpressiveCode,
} from "./src/lib/expressive-code"
import { temmlMath } from "./src/lib/math"
import { calloutDirective } from "./src/lib/callout"
import { externalLinks } from "./src/lib/external-links"
import { headingNamespace } from "./src/lib/heading-namespace"
import { headingAnchors } from "./src/lib/heading-anchors"

function pagefind(): AstroIntegration {
  return {
    name: "pagefind",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const outDir = fileURLToPath(dir)
        const { index } = await pagefindLib.createIndex({})
        if (!index) {
          logger.error("Pagefind failed to create an index")
          return
        }
        await index.addDirectory({ path: outDir })
        await index.writeFiles({ outputPath: join(outDir, "pagefind") })
        await pagefindLib.close()
        logger.info("Pagefind index written to /pagefind")
      },
    },
  }
}

export default defineConfig({
  devToolbar: {
    enabled: false,
  },
  site: "https://astro-erudite.vercel.app",
  prefetch: { prefetchAll: true },
  integrations: [
    sitemap({
      filter: (page) =>
        !/\/blog\/[^/]+\/[^/]+\/?$/.test(page) &&
        !/\/authors\/[^/]+\/?$/.test(page) &&
        !page.includes("/tags/"),
    }),
    pagefind(),
  ],
  markdown: {
    syntaxHighlight: false,
    processor: satteri({
      features: { directive: true, math: true },
      mdastPlugins: [calloutDirective, inlineExpressiveCode, temmlMath],
      hastPlugins: [
        externalLinks,
        blockExpressiveCode,
        headingNamespace,
        headingAnchors,
      ],
    }),
  },
})
