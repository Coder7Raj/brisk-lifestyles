import { useState } from "react";
import { navigateTo } from "../../routes/router.jsx";
import { apiRequest } from "../../services/api.js";
import { AuthLayout, SignedIn } from "./Register.jsx";

export default function Login({ user, onAuthenticated }) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <SignedIn user={user} />;

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to access your Brisk Lifestyles account."
    >
      <form
        className="mt-7 grid gap-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setError("");
          setSubmitting(true);
          const payload = Object.fromEntries(
            new FormData(event.currentTarget).entries(),
          );
          try {
            const result = await apiRequest("/auth/login", {
              method: "POST",
              body: JSON.stringify(payload),
            });
            onAuthenticated(result.user);
            navigateTo("/");
          } catch (requestError) {
            setError(requestError.message);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <label className="grid gap-1.5 text-sm font-semibold">
          Email
          <input
            name="email"
            required
            type="email"
            maxLength={254}
            autoComplete="email"
            className="h-12 rounded-xl border border-[#dddae0] bg-white px-4 font-normal"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Password
          <input
            name="password"
            required
            type="password"
            maxLength={128}
            autoComplete="current-password"
            className="h-12 rounded-xl border border-[#dddae0] bg-white px-4 font-normal"
          />
        </label>
        {error && (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <button
          disabled={submitting}
          className="mt-2 h-12 rounded-full bg-[#353793] text-sm font-bold text-white disabled:opacity-60"
        >
          {submitting ? "Please wait…" : "Sign in"}
        </button>
      </form>
      <p className="mt-5 text-sm text-[#77788d]">
        New to Brisk Lifestyles?{" "}
        <a className="font-semibold text-[#353793] underline" href="/register">
          Create account
        </a>
      </p>
    </AuthLayout>
  );
}
