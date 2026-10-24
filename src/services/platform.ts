import { apiRequest } from "./backend";
export interface Account { professional?: boolean; id: number; nome: string; brandName: string; logo: string | null; primaryColor: string; accentColor: string; createdAt: string; trialEndsAt: string; paidUntil: string | null; suspended: boolean }
export interface Instance { id: number; name: string }
export interface Mailbox { id: number; name: string; email: string; verified: boolean }
export interface Member { id: number; name: string; email: string; active: boolean }
export interface SubscriptionInfo { tier: "TRIAL" | "PRO"; whatsappLimit: number; gmailLimit: number; upgradePriceCents: number; currency: string }
export interface CheckoutOrder { id: string; paymentMethod: "PIX" | "CARD"; status: "PENDING" | "PAID"; amountCents: number; currency: string; expiresAt: string; paidAt: string | null; simulation: boolean; pixCode: string | null }
export interface Context { photo?: string | null; subscription?: SubscriptionInfo; role: string; name: string; email: string; account: Account | null; active: boolean; simulationEnabled: boolean; instances: Instance[]; mailboxes: Mailbox[]; users: Member[] }
export interface Client { professional?: boolean; id: number; nome: string; email: string | null; trialEndsAt: string; paidUntil: string | null; suspended: boolean; instances: number; gmails: number; users: number }
export interface Connection { instanceName: string; state: string; qrCode: string | null; pairingCode: string | null }
export function platformRequest<T>(path: string, accountId: string | null, method = "GET", body?: object) {
  const query = accountId ? `?accountId=${encodeURIComponent(accountId)}` : "";
  return apiRequest<T>(`/api/platform${path}${query}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
}

export function planFor(context: Context): SubscriptionInfo {
  if(context.subscription) return context.subscription;
  const paid=!!context.account?.professional && !!context.account?.paidUntil && new Date(context.account.paidUntil)>new Date();
  return {tier:paid?"PRO":"TRIAL",whatsappLimit:paid?3:1,gmailLimit:paid?2:1,upgradePriceCents:9990,currency:"BRL"};
}
export function workspaceLink(path: string, accountId: string | null, reason?: string) {
 const params=new URLSearchParams(); if(accountId) params.set("account",accountId); if(reason) params.set("reason",reason);
 return `/app${path}${params.size?`?${params}`:""}`;
}
