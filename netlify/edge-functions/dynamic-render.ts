import type { Context } from "@netlify/edge-functions";

// Complete list of search engine crawlers, social preview bots, and SEO audit tools
const BOT_USER_AGENTS = [
  "googlebot",
  "bingbot",
  "yandexbot",
  "duckduckbot",
  "baiduspider",
  "slurp",
  "twitterbot",
  "facebookexternalhit",
  "facebot",
  "linkedinbot",
  "embedly",
  "quora link preview",
  "showyoubot",
  "outbrain",
  "pinterest/0.",
  "developers.google.com/+/web/snippet",
  "slackbot",
  "vkshare",
  "w3c_validator",
  "redditbot",
  "applebot",
  "whatsapp",
  "flipboard",
  "tumblr",
  "bitlybot",
  "skypeuripreview",
  "nuzzel",
  "discordbot",
  "google page speed",
  "qwantify",
  "pinterestbot",
  "bitrix link preview",
  "xing-content-tab-receiver",
  "telegrambot",
  "seznambot",
  "ahrefsbot",
  "semrushbot",
  "screaming frog seo spider",
  "google-inspectiontool",
  "storebot-google",
  "mediapartners-google",
  "adsbot-google",
];

const BOT_REGEX = new RegExp(BOT_USER_AGENTS.join("|"), "i");

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);

  // 1. Never intercept static assets (images, css, js, fonts, sitemap, robots, etc.)
  if (
    url.pathname.includes(".") &&
    !url.pathname.endsWith(".html")
  ) {
    return context.next();
  }

  // 2. Identify if requester is a bot or crawler (or test query param _bot=1)
  const userAgent = request.headers.get("user-agent") || "";
  const isBot = BOT_REGEX.test(userAgent) || url.searchParams.has("_bot") || url.searchParams.has("escaped_fragment");

  // 3. Search bots & social crawlers -> Serve the pre-rendered HTML file containing 100% full SEO text, headings, and JSON-LD
  if (isBot) {
    return context.next();
  }

  // 4. Real human users -> Serve the clean, pristine React SPA shell without any layout shift or flicker
  return context.rewrite("/app.html");
}
