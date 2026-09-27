"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { MediaAssetOption } from "@/features/admin-articles/media-contracts";
import { mediaIdPattern, safePublicMediaUrl } from "@/features/admin-articles/media-contracts";

type Props = {
  label: string;
  value: string | null;
  selectedAsset?: MediaAssetOption | null;
  onChange: (asset: MediaAssetOption | null) => void;
};

function isMediaAssetOption(value: unknown): value is MediaAssetOption {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<MediaAssetOption>;
  return typeof item.id === "string" && mediaIdPattern.test(item.id)
    && typeof item.url === "string" && safePublicMediaUrl(item.url) !== null
    && typeof item.label === "string" && typeof item.alt === "string";
}

export function MediaPicker({ label, value, selectedAsset, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [offset, setOffset] = useState(0);
  const [items, setItems] = useState<MediaAssetOption[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadAlt, setUploadAlt] = useState("");
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const selected = items.find((item) => item.id === value) ?? (selectedAsset?.id === value ? selectedAsset : null);

  async function copySelectedMediaDetails() {
    if (!selected) return;
    const text = [
      `mediaId: ${selected.id}`,
      `url: ${selected.url}`,
      `label: ${selected.label}`,
      `alt: ${selected.alt || ""}`,
      `width: ${selected.width ?? ""}`,
      `height: ${selected.height ?? ""}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Τα στοιχεία εικόνας αντιγράφηκαν.");
    } catch {
      setCopyStatus("Δεν ήταν δυνατή η αντιγραφή.");
    }
  }

  async function uploadImage(file: File | null) {
    if (!file) return;
    setError("");
    if (file.size > 300 * 1024) {
      setError("Η εικόνα πρέπει να είναι έως 300KB.");
      return;
    }
    const body = new FormData();
    body.set("file", file);
    body.set("alt", uploadAlt);
    setUploading(true);
    try {
      const response = await fetch("/api/admin/media/upload", { method: "POST", body, credentials: "same-origin", cache: "no-store" });
      const payload = await response.json() as { item?: unknown; error?: unknown };
      if (!response.ok || !isMediaAssetOption(payload.item)) throw new Error(typeof payload.error === "string" ? payload.error : "Η μεταφόρτωση απέτυχε.");
      setItems((previous) => [payload.item as MediaAssetOption, ...previous.filter((item) => item.id !== (payload.item as MediaAssetOption).id)]);
      onChange(payload.item as MediaAssetOption);
      setUploadAlt("");
      setOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Η μεταφόρτωση απέτυχε.");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`/api/admin/media/search?q=${encodeURIComponent(query)}&offset=${offset}`, { signal: controller.signal, credentials: "same-origin", cache: "no-store" });
        if (!response.ok) throw new Error("Media search failed.");
        const body = await response.json() as { items?: unknown; hasMore?: unknown };
        const next = Array.isArray(body.items) ? body.items.filter(isMediaAssetOption) : [];
        setItems((previous) => offset === 0 ? next : [...previous, ...next.filter((item) => !previous.some((existing) => existing.id === item.id))]);
        setHasMore(body.hasMore === true);
      } catch (reason) {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? "Δεν ήταν δυνατή η ανάκτηση εικόνων." : "Σφάλμα media library.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [open, query, offset]);

  return <div className="admin-media-picker">
    <div className="admin-media-picker__current">
      {selected ? <Image src={selected.url} alt={selected.alt || label} width={selected.width || 240} height={selected.height || 150} unoptimized /> : <span aria-hidden="true">◇</span>}
      <div><strong>{selected ? selected.label : "Χωρίς εικόνα"}</strong><small>{selected?.alt ? `Alt: ${selected.alt}` : selected ? "Η εικόνα δεν έχει alt text στη βιβλιοθήκη." : "Επίλεξε από τη βιβλιοθήκη εικόνων."}</small></div>
    </div>
    <div className="admin-media-picker__actions"><button type="button" aria-expanded={open} onClick={() => setOpen((current) => !current)}>{open ? "Κλείσιμο βιβλιοθήκης" : "Επιλογή εικόνας"}</button>{selected ? <button type="button" onClick={() => { void copySelectedMediaDetails(); }}>Copy media ID</button> : null}{value ? <button type="button" onClick={() => onChange(null)}>Αφαίρεση</button> : null}</div>
    {copyStatus ? <p className="admin-media-picker__status" role="status">{copyStatus}</p> : null}
    {open ? <div className="admin-media-picker__library">
      <label>Αναζήτηση εικόνας<input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setOffset(0); setItems([]); setHasMore(false); }} maxLength={80} placeholder="Όνομα αρχείου ή alt text" /></label>
      <div className="admin-media-picker__upload">
        <strong>Νέα εικόνα</strong>
        <small>JPG, PNG ή WEBP έως 300KB. Μετά τη μεταφόρτωση επιλέγεται αυτόματα.</small>
        <label>Alt text<input value={uploadAlt} onChange={(event) => setUploadAlt(event.target.value)} maxLength={512} placeholder="Περιγραφή εικόνας" /></label>
        <label className="admin-media-picker__file">Upload εικόνας<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => { void uploadImage(event.target.files?.[0] ?? null); event.currentTarget.value = ""; }} /></label>
        {uploading ? <p role="status">Μεταφόρτωση εικόνας…</p> : null}
      </div>
      {error ? <p role="alert">{error}</p> : null}
      <div className="admin-media-picker__grid">
        {items.map((item) => <button type="button" key={item.id} aria-pressed={item.id === value} onClick={() => { onChange(item); setOpen(false); }}>
          <Image src={item.url} alt={item.alt || item.label} width={item.width || 240} height={item.height || 150} unoptimized loading="lazy" />
          <span>{item.label}</span><small>{item.alt || "Χωρίς alt text"}</small>
        </button>)}
      </div>
      {!loading && !items.length && !error ? <p>Δεν υπάρχουν ακόμη διαθέσιμες εικόνες. Η εισαγωγή WordPress παραμένει dry-run.</p> : null}
      {hasMore ? <button className="admin-media-picker__more" type="button" disabled={loading} onClick={() => setOffset((current) => current + 24)}>Περισσότερες εικόνες ↓</button> : null}
      {loading ? <p role="status">Φόρτωση εικόνων…</p> : null}
    </div> : null}
  </div>;
}
