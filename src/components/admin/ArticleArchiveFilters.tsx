"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, type ChangeEvent, type FormEvent } from "react";
import type { AdminArticleSort, AdminArticleStatus } from "@/features/admin-articles/archive-contracts";

export function ArticleArchiveFilters({ year, search, sort, status }: {
  year: number;
  search: string;
  sort: AdminArticleSort;
  status: AdminArticleStatus;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  const navigate = (nextSort = sort, nextStatus = status) => {
    const query = new URLSearchParams();
    const value = input.current?.value.trim() ?? search;
    if (value) query.set("q", value);
    if (nextSort !== "recent") query.set("sort", nextSort);
    if (nextStatus !== "all") query.set("status", nextStatus);
    router.push(`/admin/articles/${year}${query.size ? `?${query}` : ""}`);
  };

  return <form className="admin-article-filters" role="search" aria-label="Αναζήτηση και ταξινόμηση άρθρων"
    onSubmit={(event: FormEvent<HTMLFormElement>) => { event.preventDefault(); navigate(); }}>
    <label><span className="sr-only">Αναζήτηση άρθρων</span><Search aria-hidden="true" />
      <input ref={input} name="q" type="search" defaultValue={search} placeholder="Αναζήτηση τίτλου ή λέξης…" />
    </label>
    <button type="submit">Αναζήτηση</button>
    <label className="admin-article-filters__sort"><span className="sr-only">Ταξινόμηση άρθρων</span>
      <select name="sort" value={sort} onChange={(event: ChangeEvent<HTMLSelectElement>) => navigate(event.target.value as AdminArticleSort)}>
        <option value="recent">Πιο πρόσφατα</option>
        <option value="oldest">Παλαιότερα</option>
        <option value="az">Α–Ω</option>
        <option value="za">Ω–Α</option>
      </select>
    </label>
    <label className="admin-article-filters__sort"><span className="sr-only">Κατάσταση άρθρων</span>
      <select name="status" value={status} onChange={(event: ChangeEvent<HTMLSelectElement>) => navigate(sort, event.target.value as AdminArticleStatus)}>
        <option value="all">Όλες οι καταστάσεις</option><option value="draft">Πρόχειρα</option>
        <option value="review">Για έλεγχο</option><option value="scheduled">Προγραμματισμένα</option>
        <option value="published">Δημοσιευμένα</option><option value="archived">Αρχειοθετημένα</option>
      </select>
    </label>
  </form>;
}
