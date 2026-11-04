"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { db } from "@/db"
import { oauthCodes } from "@/db/schema"
import { CODE_TTL_S, getClient, isValidResource, originFromHeaders, randomToken, sha256 } from "@/lib/oauth"

// Everything is re-validated here: hidden form fields are client-controlled.
export async function decideAuthorization(formData: FormData) {
  const session = await auth()
  if (!session) redirect("/login")

  const get = (name: string) => (formData.get(name) as string | null) ?? ""
  const clientId = get("client_id")
  const redirectUri = get("redirect_uri")
  const codeChallenge = get("code_challenge")
  const resource = get("resource") || null
  const state = get("state")
  const origin = originFromHeaders(await headers())

  const client = await getClient(clientId)
  if (!client || !client.redirectUris.includes(redirectUri)) throw new Error("Invalid authorization request")
  if (!/^[A-Za-z0-9\-_]{43,128}$/.test(codeChallenge) || !isValidResource(resource, origin)) {
    throw new Error("Invalid authorization request")
  }

  const target = new URL(redirectUri)
  if (state) target.searchParams.set("state", state)
  target.searchParams.set("iss", origin)

  if (get("decision") !== "approve") {
    target.searchParams.set("error", "access_denied")
    redirect(target.toString())
  }

  const code = randomToken()
  await db.insert(oauthCodes).values({
    codeHash: sha256(code),
    clientId,
    userId: parseInt(session.user.id),
    familyId: randomToken(),
    redirectUri,
    codeChallenge,
    resource,
    expiresAt: new Date(Date.now() + CODE_TTL_S * 1000),
  })
  target.searchParams.set("code", code)
  redirect(target.toString())
}
