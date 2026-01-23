import { redirect } from "next/navigation";
import { get_session } from "@/lib/auth";
import { APP_ROUTES } from "@tireoff/shared";
import { LoginForm } from "@/components/auth/login_form";
import { Circle } from "lucide-react";

/**
 * Login page with clean design
 * Mobile-first phone + OTP login
 * @returns Login page component
 */
export default async function LoginPage() {
  console.log("[Page] Login - checking session");

  const session = await get_session();

  if (session) {
    console.log("[Page] Login - user already logged in, redirecting");
    redirect(APP_ROUTES.CARS);
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="pt-16 pb-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Circle className="h-10 w-10 text-primary fill-primary/20" />
        </div>
        <h1 className="text-4xl font-bold text-primary">
          TireTrack
        </h1>
        <p className="mt-3 text-muted-foreground">
          Register and track your vehicle plates
        </p>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-start justify-center px-4 pb-8">
        <div className="w-full max-w-sm">
          <LoginForm />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} TireTrack. All rights reserved.</p>
      </footer>
    </div>
  );
}
