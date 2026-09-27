import "server-only";

import type { z } from "zod";
import type { contactSubmissionSchema } from "@/features/contact/contracts";
import { getSmtpTransport, smtpConfigured, smtpFromAddress } from "./smtp";

type EditorialProposal = z.infer<typeof contactSubmissionSchema>;

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
  }[character] ?? character));
}

export async function sendEditorialProposal(input: EditorialProposal) {
  if (!smtpConfigured()) throw new Error("SMTP is disabled.");
  const fromAddress = smtpFromAddress();
  const recipient = process.env.CONTACT_RECIPIENT_EMAIL?.trim()
    || process.env.CONTACT_TO_EMAIL?.trim()
    || "info@acadimies.gr";
  const labels = {
    NEWS: "Είδηση", OPINION: "Άρθρο γνώμης", INTERVIEW: "Συνέντευξη", EVENT: "Διοργάνωση", OTHER: "Άλλο",
  } as const;
  const optional = (label: string, value?: string) => value ? `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>` : "";
  const isProposal = input.submissionType === "ARTICLE_IDEA";
  const subject = isProposal
    ? `Νέα πρόταση · ${labels[input.contributionType]} · ${input.name}`
    : `Νέο μήνυμα επικοινωνίας · ${input.name}`;
  const typeLine = isProposal ? `Τύπος: ${labels[input.contributionType]}` : "Τύπος: Γενικό μήνυμα";
  const proposalText = isProposal ? [`Προτεινόμενος τίτλος: ${input.proposedTitle}`] : [];
  const proposalHtml = isProposal
    ? `<p><strong>Τύπος:</strong> ${escapeHtml(labels[input.contributionType])}</p><p><strong>Προτεινόμενος τίτλος:</strong> ${escapeHtml(input.proposedTitle)}</p>`
    : "<p><strong>Τύπος:</strong> Γενικό μήνυμα</p>";
  return getSmtpTransport().sendMail({
    from: `Acadimies Website <${fromAddress}>`,
    to: `Acadimies Editorial <${recipient}>`,
    replyTo: input.email,
    subject: subject.slice(0, 240),
    text: [`Όνομα: ${input.name}`, `Email: ${input.email}`, typeLine,
      input.phone ? `Τηλέφωνο: ${input.phone}` : "", ...proposalText,
      "", input.message].filter(Boolean).join("\n"),
    html: `<h2>${isProposal ? "Νέα πρόταση άρθρου" : "Νέο μήνυμα επικοινωνίας"} για την Ακαδημίες</h2><p><strong>Όνομα:</strong> ${escapeHtml(input.name)}</p><p><strong>Email:</strong> ${escapeHtml(input.email)}</p>${proposalHtml}${optional("Τηλέφωνο", input.phone)}<p><strong>Μήνυμα:</strong><br>${escapeHtml(input.message).replace(/\r?\n/g, "<br>")}</p>`,
  });
}
