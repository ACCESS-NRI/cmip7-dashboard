import { defineContentConfig, defineCollection, z } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    content: defineCollection({
      type: "page",
      source: "**/*.md",
      // `title` and `description` are part of the built-in page schema; declare
      // the extra frontmatter CMIP7 updates use so it is typed on the items.
      schema: z.object({
        date: z.string().optional(),
        author: z.string().optional(),
        // Tags an explainer post to a CMIP7 experiment by name; the dashboard
        // surfaces it as that experiment's Overview-level content. Tagged
        // posts still appear in the /blog feed like any other post.
        experiment: z.string().optional(),
        // Optional outbound links (WCRP/CMIP papers, press releases,
        // explainers) rendered as a "Further reading" list.
        furtherReading: z
          .array(z.object({ title: z.string(), url: z.string() }))
          .optional(),
      }),
    }),
    // Jargon glossary (issue #12). A data collection (one YAML file per term)
    // so terms are editable without code changes and typed against this schema.
    // Feeds both the /glossary page and the inline <Jargon> component via the
    // shared useGlossary() composable. The file stem is the anchor slug.
    glossary: defineCollection({
      type: "data",
      source: "glossary/*.yml",
      schema: z.object({
        // Display label and primary lookup key, e.g. "DECK".
        term: z.string(),
        // Acronym long form, shown as the quick tooltip expansion.
        expansion: z.string().optional(),
        // One-line plain-language gloss (tooltip fallback + card subtitle).
        short: z.string(),
        // Fuller explanation (inline popover + glossary page body).
        long: z.string(),
        // Extra lookup keys / plurals so <Jargon term="…"> still resolves.
        aliases: z.array(z.string()).optional(),
        // Optional further reading, same shape as the blog furtherReading list.
        links: z
          .array(z.object({ title: z.string(), url: z.string() }))
          .optional(),
      }),
    }),
  },
});
