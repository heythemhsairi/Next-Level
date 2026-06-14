"use client";

/**
 * Inline video player. Turns a pasted URL (YouTube / Vimeo / Loom / Google
 * Drive / direct .mp4) into an embedded player. Falls back to a styled
 * "open in new tab" link for anything it can't embed.
 */
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");

    // YouTube
    if (host === "youtube.com" || host === "m.youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      if (u.pathname.startsWith("/shorts/"))
        return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
    }
    if (host === "youtu.be") {
      return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    }
    // Vimeo
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
    // Loom
    if (host === "loom.com" && u.pathname.includes("/share/")) {
      return url.replace("/share/", "/embed/");
    }
    if (host === "loom.com" && u.pathname.startsWith("/embed/")) return url;
    // Google Drive
    if (host === "drive.google.com") {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    }
    // Direct video file
    if (/\.(mp4|webm|ogg|mov)$/i.test(u.pathname)) return url;
  } catch {
    return null;
  }
  return null;
}

function isDirectFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
}

export function VideoEmbed({ url }: { url: string | null }) {
  if (!url) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-white/10 bg-ink-soft text-sm text-ink/40">
        No video link yet
      </div>
    );
  }

  const embed = toEmbedUrl(url);

  if (embed && isDirectFile(embed)) {
    return (
      <video
        controls
        src={embed}
        className="aspect-video w-full rounded-xl border border-white/10 bg-black"
      />
    );
  }

  if (embed) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
        <iframe
          src={embed}
          title="Video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  // Unembeddable — graceful link fallback.
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-white/10 bg-ink-soft text-sm text-brand hover:bg-white/[0.04]"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M10 8l6 4-6 4z" />
        <circle cx="12" cy="12" r="9" />
      </svg>
      Open video →
    </a>
  );
}
