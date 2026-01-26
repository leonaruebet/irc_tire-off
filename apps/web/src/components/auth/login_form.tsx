"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { phone_schema, otp_schema, mask_phone, APP_ROUTES } from "@tireoff/shared";
import { SESSION_CONFIG } from "@tireoff/shared";
import { Loader2 } from "lucide-react";

/**
 * Phone input schema
 */
const phone_form_schema = z.object({
  phone: phone_schema,
});

/**
 * OTP input schema
 */
const otp_form_schema = z.object({
  code: otp_schema,
});

type PhoneFormData = z.infer<typeof phone_form_schema>;
type OTPFormData = z.infer<typeof otp_form_schema>;

/**
 * Login form component
 * Two-step: phone input -> OTP verification
 */
export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();

  const [step, set_step] = useState<"phone" | "otp">("phone");
  const [phone, set_phone] = useState("");
  const [cooldown, set_cooldown] = useState(0);

  // Phone form
  const phone_form = useForm<PhoneFormData>({
    resolver: zodResolver(phone_form_schema),
    defaultValues: { phone: "" },
  });

  // OTP form
  const otp_form = useForm<OTPFormData>({
    resolver: zodResolver(otp_form_schema),
    defaultValues: { code: "" },
  });

  // Request OTP mutation
  const request_otp = trpc.auth.request_otp.useMutation({
    onSuccess: (data) => {
      console.log("[LoginForm] OTP request result", data);

      if (data.success) {
        set_step("otp");
        toast({
          title: t("otp_sent", { phone: mask_phone(phone) }),
        });
      } else if (data.cooldown_seconds) {
        set_cooldown(data.cooldown_seconds);
        start_cooldown_timer(data.cooldown_seconds);
        toast({
          title: t("otp_resend_wait", { seconds: data.cooldown_seconds }),
          variant: "destructive",
        });
      } else if (data.error) {
        // SMS delivery failed — surface the error to user
        console.error("[LoginForm] SMS delivery failed", { error: data.error });
        toast({
          title: t("otp_send_failed"),
          description: data.error,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("[LoginForm] OTP request error", error);
      toast({
        title: error.message,
        variant: "destructive",
      });
    },
  });

  // Verify OTP mutation
  const verify_otp = trpc.auth.verify_otp.useMutation({
    onSuccess: (data) => {
      console.log("[LoginForm] OTP verify success", data);

      if (data.success && data.session_token) {
        // Set session cookie
        document.cookie = `${SESSION_CONFIG.COOKIE_NAME}=${data.session_token}; path=/; max-age=${
          SESSION_CONFIG.EXPIRY_DAYS * 24 * 60 * 60
        }`;

        toast({
          title: "Login successful!",
        });

        // Redirect to cars page
        router.push(APP_ROUTES.CARS);
        router.refresh();
      } else {
        toast({
          title: data.error || t("otp_invalid"),
          description:
            data.attempts_remaining !== undefined
              ? `${data.attempts_remaining} attempts remaining`
              : undefined,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error("[LoginForm] OTP verify error", error);
      toast({
        title: error.message,
        variant: "destructive",
      });
    },
  });

  /**
   * Start cooldown timer
   */
  function start_cooldown_timer(seconds: number) {
    set_cooldown(seconds);
    const interval = setInterval(() => {
      set_cooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  /**
   * Handle phone form submit
   */
  async function on_phone_submit(data: PhoneFormData) {
    console.log("[LoginForm] Requesting OTP for", data.phone);
    set_phone(data.phone);
    request_otp.mutate({ phone: data.phone });
  }

  /**
   * Handle OTP form submit
   */
  async function on_otp_submit(data: OTPFormData) {
    console.log("[LoginForm] Verifying OTP");
    verify_otp.mutate({ phone, code: data.code });
  }

  /**
   * Handle resend OTP
   */
  function on_resend() {
    if (cooldown > 0) return;
    request_otp.mutate({ phone });
  }

  /**
   * Go back to phone step
   */
  function on_back() {
    set_step("phone");
    otp_form.reset();
  }

  // Phone step
  if (step === "phone") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("login_title")}</CardTitle>
          <CardDescription>
            Enter your phone number to receive a verification code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={phone_form.handleSubmit(on_phone_submit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">{t("phone_label")}</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="numeric"
                placeholder={t("phone_placeholder")}
                {...phone_form.register("phone")}
                className="text-lg"
              />
              {phone_form.formState.errors.phone && (
                <p className="text-sm text-destructive">
                  {t("phone_invalid")}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={request_otp.isPending}
            >
              {request_otp.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("request_otp")}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  // OTP step
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("otp_title")}</CardTitle>
        <CardDescription>
          {t("otp_sent", { phone: mask_phone(phone) })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={otp_form.handleSubmit(on_otp_submit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">{t("otp_label")}</Label>
            <Input
              id="code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder={t("otp_placeholder")}
              {...otp_form.register("code")}
              className="text-center text-2xl tracking-widest"
            />
            {otp_form.formState.errors.code && (
              <p className="text-sm text-destructive">{t("otp_invalid")}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={verify_otp.isPending}
          >
            {verify_otp.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("verify")}
          </Button>
          <div className="flex items-center justify-between text-sm">
            <Button type="button" variant="link" onClick={on_back} className="px-0">
              {t("back")}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={on_resend}
              disabled={cooldown > 0 || request_otp.isPending}
              className="px-0"
            >
              {cooldown > 0
                ? t("otp_resend_wait", { seconds: cooldown })
                : t("otp_resend")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
