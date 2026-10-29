import { useState } from "react";
import { navigateTo } from "../../routes/router.jsx";
import { apiRequest } from "../../services/api.js";

export default function Register({ user, onAuthenticated }) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <SignedIn user={user} />;

  return (
    <AuthLayout
      title="Create your account"
      description="Save your favorites and check out securely."
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
          if (!payload.avatarUrl?.trim()) delete payload.avatarUrl;
          try {
            const result = await apiRequest("/auth/register", {
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
          Name
          <input
            name="displayName"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            className="h-12 rounded-xl border border-[#dddae0] bg-white px-4 font-normal"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Profile image URL{" "}
          <span className="font-normal text-[#77788d]">(Optional)</span>
          <input
            name="avatarUrl"
            type="url"
            autoComplete="url"
            placeholder="https://example.com/photo.jpg"
            className="h-12 rounded-xl border border-[#dddae0] bg-white px-4 font-normal"
          />
        </label>
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
            minLength={10}
            maxLength={128}
            autoComplete="new-password"
            className="h-12 rounded-xl border border-[#dddae0] bg-white px-4 font-normal"
          />
          <small className="font-normal text-[#77788d]">
            Use at least 10 characters.
          </small>
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
          {submitting ? "Please wait…" : "Create account"}
        </button>
      </form>
      <p className="mt-5 text-sm text-[#77788d]">
        Already have an account?{" "}
        <a className="font-semibold text-[#353793] underline" href="/login">
          Sign in
        </a>
      </p>
    </AuthLayout>
  );
}

export function SignedIn({ user }) {
  return (
    <div className="mx-auto grid min-h-[55vh] max-w-[520px] place-content-center px-5 text-center">
      <h1 className="text-3xl font-extrabold">You're signed in</h1>
      <p className="mt-2 text-sm text-[#77788d]">
        Welcome, {user.displayName}.
      </p>
      <a
        className="mt-6 rounded-full bg-[#353793] px-6 py-3 text-sm font-bold text-white"
        href="/"
      >
        Continue shopping
      </a>
    </div>
  );
}

export function AuthLayout({ title, description, children }) {
  return (
    <div className="mx-auto min-h-[55vh] max-w-[480px] px-5 py-12">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-2 text-sm text-[#77788d]">{description}</p>
      {children}
    </div>
  );
}
