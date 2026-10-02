import { describe, expect, it } from "vitest";
import { mailProviderFor, pageForLinkType, parseAuthLink, parseRetryAfterSeconds } from "./auth-links";
import { getErrorMessage } from "./errors";

const q = (s: string) => new URLSearchParams(s);

describe("enlaces de email", () => {
  it("un enlace nuevo con token_hash queda pendiente hasta tocar el botón", () => {
    expect(parseAuthLink(q("token_hash=pkce_abc123def456&type=email"))).toEqual({
      kind: "token",
      tokenHash: "pkce_abc123def456",
      type: "email",
    });
    expect(parseAuthLink(q("token_hash=abc123def456&type=recovery"))).toMatchObject({ kind: "token", type: "recovery" });
  });

  it("ignora tipos desconocidos o tokens con formato raro", () => {
    expect(parseAuthLink(q("token_hash=abc123def456&type=hack")).kind).toBe("none");
    expect(parseAuthLink(q("token_hash=<script>&type=email")).kind).toBe("none");
    expect(parseAuthLink(q("")).kind).toBe("none");
  });

  it("detecta enlaces vencidos tanto en la query como en el #fragmento", () => {
    expect(parseAuthLink(q("error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid"))).toEqual({
      kind: "error",
      code: "otp_expired",
      description: "Email link is invalid",
    });
    expect(parseAuthLink(q(""), "#error=access_denied&error_code=otp_expired")).toMatchObject({ kind: "error", code: "otp_expired" });
  });

  it("status=verified (enlace abierto en otro navegador) y status=invalid", () => {
    expect(parseAuthLink(q("status=verified"))).toEqual({ kind: "verified" });
    expect(parseAuthLink(q("status=invalid"))).toMatchObject({ kind: "error", code: "invalid_link" });
  });

  it("cada tipo de enlace va a su página", () => {
    expect(pageForLinkType("recovery")).toBe("/reset-password");
    expect(pageForLinkType("email")).toBe("/confirm-email");
    expect(pageForLinkType("signup")).toBe("/confirm-email");
  });

  it("lee la espera que pide Supabase entre correos", () => {
    expect(parseRetryAfterSeconds("For security purposes, you can only request this after 37 seconds.")).toBe(37);
    expect(parseRetryAfterSeconds("Email rate limit exceeded")).toBeNull();
    expect(getErrorMessage(new Error("For security purposes, you can only request this after 1 seconds."))).toBe(
      "Por seguridad, esperá 1 segundo antes de pedir otro correo.",
    );
    expect(getErrorMessage(new Error("Email link is invalid or has expired"))).toMatch(/venció o ya se usó/);
    expect(getErrorMessage(new Error("email rate limit exceeded"))).toMatch(/muchos correos/);
  });

  it("elige el proveedor de correo según el dominio (Gmail por defecto)", () => {
    expect(mailProviderFor("ana@gmail.com")).toMatchObject({ known: true, provider: { id: "gmail" } });
    expect(mailProviderFor("ana@Hotmail.com")).toMatchObject({ known: true, provider: { id: "outlook" } });
    expect(mailProviderFor("ana@icloud.com").provider.label).toBe("iCloud Mail");
    expect(mailProviderFor("ana@empresa.com.ar")).toMatchObject({ known: false, provider: { id: "gmail" } });
    expect(mailProviderFor(null).provider.id).toBe("gmail");
  });
});
