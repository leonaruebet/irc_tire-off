"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown_menu";
import { trpc } from "@/lib/trpc";
import { toast } from "@/hooks/use_toast";
import { APP_ROUTES, SESSION_CONFIG } from "@tireoff/shared";

interface UserHeaderProps {
  user: {
    phone: string;
    phone_masked: string | null;
  };
}

/**
 * User header component
 * Shows user info and logout button
 */
export function UserHeader({ user }: UserHeaderProps) {
  const t = useTranslations("auth");
  const router = useRouter();

  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      console.log("[UserHeader] Logout success");

      // Clear session cookie
      document.cookie = `${SESSION_CONFIG.COOKIE_NAME}=; path=/; max-age=0`;

      toast({
        title: "Logged out successfully",
      });

      router.push(APP_ROUTES.LOGIN);
      router.refresh();
    },
    onError: (error) => {
      console.error("[UserHeader] Logout error", error);
      // Still clear cookie and redirect on error
      document.cookie = `${SESSION_CONFIG.COOKIE_NAME}=; path=/; max-age=0`;
      router.push(APP_ROUTES.LOGIN);
    },
  });

  function handle_logout() {
    console.log("[UserHeader] Logging out");
    logout.mutate();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center justify-between h-14 px-4">
        <h2 className="font-semibold uppercase">ทรัพย์ไพศาล</h2>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">
                {user.phone_masked || user.phone}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handle_logout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
