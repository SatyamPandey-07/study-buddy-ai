# Security Policy

## Supported Versions

Study Buddy AI is deployed continuously from the `main` branch. Only the
latest version running in production is supported with security fixes.

## Reporting a Vulnerability

If you discover a security vulnerability, **please do not open a public
issue**. Instead:

1. Use [GitHub's private vulnerability reporting](../../security/advisories/new)
   for this repo, or
2. Email **hawwyush@gmail.com** with details (steps to reproduce, impact, and
   any suggested fix).

You should expect an initial response within 72 hours. We'll work with you to
understand and validate the issue, and credit you in the fix release notes
unless you'd prefer to stay anonymous.

Please do not test for vulnerabilities against the production deployment
(e.g. rate-limit bypass, SSRF, auth bypass) beyond what's needed to
demonstrate the issue — use a local instance instead.

## Scope

In scope: the app code in this repository (frontend, `server/`, `api/`,
Prisma schema, auth/RBAC logic, rate limiting). Out of scope: third-party
services we depend on (Clerk, Neon, Groq, Vercel) — please report those
directly to the respective vendor.
