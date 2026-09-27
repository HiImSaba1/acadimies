export type PublicAuthorProfile = {
  username: string;
  route: string;
  displayName: string;
  eyebrow: string;
  intro: string;
  biography: string;
  facebookUrl?: string;
};

const profiles = [
  {
    username: "dora-ioakeimidou",
    route: "/dora-ioakeimidou",
    displayName: "Δώρα Ιωακειμίδου",
    eyebrow: "Η φωνή της έκδοσης",
    intro: "Γράφει για το ποδόσφαιρο ακαδημιών με το παιδί, την εκπαίδευση και τη χαρά του παιχνιδιού στο κέντρο.",
    biography: "Στην αρθρογραφία της στην Ακαδημίες, η Δώρα Ιωακειμίδου εξετάζει τη νοοτροπία γύρω από το παιδικό ποδόσφαιρο, τη σχέση γονέα και προπονητή και τις συνθήκες που βοηθούν ένα παιδί να εξελιχθεί χωρίς να χάνει τη χαρά του παιχνιδιού.",
    facebookUrl: "https://www.facebook.com/doraioakeimidoy",
  },
] as const satisfies readonly PublicAuthorProfile[];

export function publicAuthorByUsername(username: string | null | undefined): PublicAuthorProfile | null {
  return profiles.find((profile) => profile.username === username) ?? null;
}

export function publicAuthorUrl(username: string | null | undefined): string | null {
  return publicAuthorByUsername(username)?.route ?? null;
}

export function publicAuthorProfiles(): readonly PublicAuthorProfile[] {
  return profiles;
}
