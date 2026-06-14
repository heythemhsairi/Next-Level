"use client";

import { NotificationBell, type NotificationRow } from "./notification-bell";

type Props = {
  notifications: NotificationRow[];
};

/**
 * Slim contextual top bar. The brand, navigation, and user/sign-out now live
 * in the full-height sidebar — this bar just carries the notification bell
 * (and leaves room for page-level actions on the right).
 */
export function Topbar({ notifications }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-[64px] items-center justify-end gap-2 border-b border-white/8 bg-ink/55 px-4 backdrop-blur-2xl sm:px-6 md:px-10">
      <NotificationBell initial={notifications} />
    </header>
  );
}
