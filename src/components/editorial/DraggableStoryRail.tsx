"use client";

import { useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function DraggableStoryRail({ children }: { children: ReactNode }) {
  const rail = useRef<HTMLDivElement>(null);
  const gesture = useRef({ pointerId: -1, x: 0, scrollLeft: 0, moved: false });
  const [edges, setEdges] = useState({ first: true, last: false });

  const updateEdges = () => {
    const element = rail.current;
    if (!element) return;
    const next = { first: element.scrollLeft <= 2,
      last: element.scrollLeft >= element.scrollWidth - element.clientWidth - 2 };
    setEdges((previous) => previous.first === next.first && previous.last === next.last ? previous : next);
  };
  const navigate = (direction: -1 | 1) => {
    const element = rail.current;
    const card = element?.querySelector<HTMLElement>(".popular-carousel__item");
    if (!element || !card) return;
    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    element.scrollBy({ left: direction * (card.getBoundingClientRect().width + gap),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    gesture.current = { pointerId: event.pointerId, x: event.clientX, scrollLeft: event.currentTarget.scrollLeft, moved: false };
    event.currentTarget.setAttribute("data-dragging", "true");
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    if (gesture.current.pointerId !== event.pointerId) return;
    const distance = event.clientX - gesture.current.x;
    if (Math.abs(distance) > 6) gesture.current.moved = true;
    event.currentTarget.scrollLeft = gesture.current.scrollLeft - distance;
  };
  const release = (event: PointerEvent<HTMLDivElement>) => {
    if (gesture.current.pointerId !== event.pointerId) return;
    gesture.current.pointerId = -1;
    event.currentTarget.removeAttribute("data-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const click = (event: MouseEvent<HTMLDivElement>) => {
    if (!gesture.current.moved) return;
    event.preventDefault();
    event.stopPropagation();
    gesture.current.moved = false;
  };

  return <>
    <div className="popular-carousel__navigation" aria-label="Πλοήγηση ιστοριών">
      <button type="button" aria-label="Προηγούμενες ιστορίες" disabled={edges.first} onClick={() => navigate(-1)}><ArrowLeft aria-hidden="true" /></button>
      <button type="button" aria-label="Επόμενες ιστορίες" disabled={edges.last} onClick={() => navigate(1)}><ArrowRight aria-hidden="true" /></button>
    </div>
    <div ref={rail} className="popular-carousel__rail" aria-label="Περισσότερο προβεβλημένες ιστορίες" tabIndex={0} data-draggable-rail onScroll={updateEdges}
      onPointerDown={down} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onClickCapture={click}>{children}</div>
  </>;
}
