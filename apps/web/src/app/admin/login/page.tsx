"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/hooks/use_toast";

/**
 * Admin login page
 * Uses hardcoded credentials: admin / tireoff2026
 * Supports i18n for Thai/English
 */
export default function AdminLoginPage() {
  console.log("[AdminLoginPage] Rendering");

  const router = useRouter();
  const t = useTranslations("admin.login_page");

  const login_schema = z.object({
    username: z.string().min(1, t("username_required")),
    password: z.string().min(1, t("password_required")),
  });

  type LoginFormData = z.infer<typeof login_schema>;

  const form = useForm<LoginFormData>({
    resolver: zodResolver(login_schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const login = trpc.admin.login.useMutation({
    onSuccess: (data) => {
      console.log("[AdminLogin] Success");

      // Store admin token in localStorage
      localStorage.setItem("admin_token", data.token);

      toast({
        title: t("login_success"),
      });

      router.push("/admin");
    },
    onError: (error) => {
      console.error("[AdminLogin] Error", error);
      toast({
        title: t("login_failed"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Handle form submission
   * Triggers login mutation
   * @param data - Form data with username and password
   */
  function on_submit(data: LoginFormData) {
    console.log("[AdminLogin] Submitting");
    login.mutate(data);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8 bg-muted/30">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">{t("admin_portal")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("sign_in_subtitle")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("sign_in")}</CardTitle>
            <CardDescription>
              {t("enter_credentials")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(on_submit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t("username")}</Label>
                <Input
                  id="username"
                  placeholder={t("username_placeholder")}
                  {...form.register("username")}
                />
                {form.formState.errors.username && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("password_placeholder")}
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={login.isPending}
              >
                {login.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("sign_in")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          {t("customer_portal")} <a href="/login" className="text-primary hover:underline">{t("login_here")}</a>
        </p>
      </div>
    </div>
  );
}
