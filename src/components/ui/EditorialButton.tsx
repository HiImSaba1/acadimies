"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import { useRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes } from "react";
import { useMenuHoverAnimation } from "@/components/headers/useMenuHoverAnimation";

type SharedProps = {
  label: string;
  variant?: "dark" | "light" | "outline";
  arrow?: "left" | "right" | "up-right";
  className?: string;
  "data-footer-copy"?: string;
  "data-hero-copy"?: string;
};

type LinkButtonProps = SharedProps & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "className" | "href">;
type ActionButtonProps = SharedProps & { href?: never } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "className">;

export type EditorialButtonProps = LinkButtonProps | ActionButtonProps;

export function EditorialButton({ label, variant = "dark", arrow = "up-right", className = "", ...props }: EditorialButtonProps) {
  const element = useRef<HTMLElement>(null);
  useMenuHoverAnimation(element, label);
  const classes = `editorial-button editorial-button--${variant} ${className}`.trim();
  const icon = arrow === "left" ? <ArrowLeft /> : arrow === "right" ? <ArrowRight /> : <ArrowUpRight />;
  const content = <><span className="editorial-button__fill" aria-hidden="true" /><span className="editorial-button__label"><span data-hover-text-base>{label}</span><span data-hover-text-active aria-hidden="true">{label}</span></span><span className="editorial-button__arrow" aria-hidden="true">{icon}</span></>;

  if ("href" in props && props.href) {
    const { href, onClick, target, ...anchorProps } = props as LinkButtonProps;
    return <Link ref={(node) => { element.current = node; }} href={href} target={target} className={classes} onClick={onClick}
      transitionTypes={href.startsWith("/") && target !== "_blank" ? ["editorial-link"] : undefined} {...anchorProps}>{content}</Link>;
  }

  const buttonProps = props as ActionButtonProps;
  return <button ref={(node) => { element.current = node; }} className={classes} {...buttonProps}>{content}</button>;
}
