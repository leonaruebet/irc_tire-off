"use client";

import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Phone, LogOut, Car, Loader2, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "@/hooks/use_toast";
import { APP_ROUTES, SESSION_CONFIG } from "@tireoff/shared";

interface UserProfileProps {
  user: {
    phone: string;
    phone_masked: string | null;
  };
}

/**
 * User profile component with i18n support
 * Shows user information and logout option
 * @param props - User data
 * @returns User profile card
 */
export function UserProfile({ user }: UserProfileProps) {
  console.log("[UserProfile] Rendering");

  const t = useTranslations("profile");
  const t_auth = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();

  // Get car count for stats
  const { data: cars } = trpc.car.list.useQuery();

  /**
   * Toggle language between EN and TH
   * Sets the locale cookie and refreshes the page
   */
  function toggle_language() {
    const new_locale = locale === "th" ? "en" : "th";
    console.log("[UserProfile] Toggling language", { from: locale, to: new_locale });
    document.cookie = `locale=${new_locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    router.refresh();
  }

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      console.log("[UserProfile] Logout success");
      document.cookie = `${SESSION_CONFIG.COOKIE_NAME}=; path=/; max-age=0`;
      toast({ title: t("logout_success") });
      router.push(APP_ROUTES.LOGIN);
      router.refresh();
    },
    onError: (error) => {
      console.error("[UserProfile] Logout error", error);
      document.cookie = `${SESSION_CONFIG.COOKIE_NAME}=; path=/; max-age=0`;
      router.push(APP_ROUTES.LOGIN);
    },
  });

  /**
   * Handle logout button click
   */
  function handle_logout() {
    console.log("[UserProfile] Initiating logout");
    logout.mutate();
  }

  return (
    <div className="space-y-4">
      {/* User Info Card */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-lg uppercase">{t("account_info")}</h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Phone number */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
            <div className="p-2.5 rounded-xl bg-primary text-white">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("phone_number")}</p>
              <p className="font-medium">{user.phone_masked || user.phone}</p>
            </div>
          </div>

          {/* Registered plates count */}
          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
            <div className="p-2.5 rounded-xl bg-primary text-white">
              <Car className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("registered_plates")}</p>
              <p className="font-medium">{t("plates_count", { count: cars?.length || 0 })}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Card */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-lg uppercase">{t("settings")}</h2>
        </div>
        <div className="p-5">
          {/* Language Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary text-white">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("language")}</p>
                <p className="font-medium">{locale === "th" ? "ไทย" : "English"}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggle_language}
              className="font-semibold"
            >
              {locale === "th" ? "EN" : "TH"}
            </Button>
          </div>
        </div>
      </div>

      {/* Actions Card */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-semibold text-lg uppercase">{t("actions")}</h2>
        </div>
        <div className="p-5">
          <Button
            variant="destructive"
            className="w-full gap-2"
            onClick={handle_logout}
            disabled={logout.isPending}
          >
            {logout.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            {t_auth("logout")}
          </Button>
        </div>
      </div>
    </div>
  );
}
