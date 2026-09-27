import type { NextRequest } from "next/server";
import { categoryPages } from "@/features/category-pages/catalog";
import { parsePublicSearchParams } from "@/features/public-search/contracts";
import { searchPublicStories } from "@/features/public-search/data";

function normalize(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("el-GR");
}

export async function GET(request: NextRequest) {
  const input = parsePublicSearchParams({ q: request.nextUrl.searchParams.get("q") ?? "" });
  if (input.query.length < 4) return Response.json({ results: [] });

  const term = normalize(input.query);
  const categoryResults = categoryPages.filter((category) =>
    normalize(`${category.name} ${category.eyebrow} ${category.description}`).includes(term),
  ).map((category) => ({ type: "category" as const, title: category.name, eyebrow: "Θεματική ενότητα", href: `/category/${category.slug}` }));
  const articleResults = (await searchPublicStories(input)).stories.map((story) => ({
    type: "article" as const, title: story.title, eyebrow: story.category, href: story.href ?? `/posts/${story.slug}`,
  }));
  const unique = [...categoryResults, ...articleResults].filter((result, index, results) =>
    results.findIndex((candidate) => candidate.href === result.href) === index,
  ).slice(0, 5);

  return Response.json({ results: unique }, { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } });
}
