import { AdminLoginExperience } from "@/components/admin/AdminLoginExperience";
import { getHomepageHeroStories } from "@/features/homepage-hero/data";
import "../admin.css";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const requestedUrl = (await searchParams).callbackUrl;
  const candidate = typeof requestedUrl === "string" ? requestedUrl : undefined;
  const callbackUrl = candidate?.startsWith("/") && !candidate.startsWith("//")
    ? candidate
    : "/admin";
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
  );
  let backgroundImage = "/images/2016/03/391.webp";
  try {
    const heroStories = await getHomepageHeroStories();
    backgroundImage = heroStories[2]?.imageUrl ?? backgroundImage;
  } catch {
    // Authentication must stay reachable during a temporary database outage.
  }

  return (
    <AdminLoginExperience
      callbackUrl={callbackUrl}
      googleEnabled={googleEnabled}
      year={new Date().getUTCFullYear()}
      backgroundImage={backgroundImage}
    />
  );
}
