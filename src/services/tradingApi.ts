import { api } from "./api";
import type { ContractTypeId } from "@/components/options/layout/contractTypes";
import type {
  ConfirmResponse as GeneratedConfirmResponse,
  ProposalRequest as GeneratedProposalRequest,
  ProposalResponse as GeneratedProposalResponse,
  ProposalStreamFrame as GeneratedProposalStreamFrame,
} from "@/services/api/model";

/**
 * Trading service client — Deriv OAuth linking + the two-phase proposal /
 * confirm order flow.
 *
 * Contract mapping (frontend id + side → Deriv contract_type) lives on the
 * BACKEND; the frontend only sends its own ids and the per-type params. The
 * backend validates the combination and returns 422 on anything invalid.
 */

// ─── Deriv OAuth ────────────────────────────────────────────────────────────

export interface DerivAccount {
  account: string;
  token: string;
  currency: string;
  isVirtual: boolean;
}

export interface AccountStatus {
  linked: boolean;
  deriv_account_id?: string;
  currency?: string;
  is_virtual: boolean;
}

export const derivApi = {
  /** 
   * Start linking — Generates PKCE parameters, stores code_verifier in sessionStorage,
   * and returns the Deriv authorize URL + state.
   */
  async authorize(redirectUri: string): Promise<{ authorize_url: string; state: string }> {
    // 1. Generate code_verifier
    const array = crypto.getRandomValues(new Uint8Array(64));
    const codeVerifier = Array.from(array)
      .map(v => 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'[v % 66])
      .join('');

    // 2. Generate code_challenge (S256)
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
    const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hash)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 3. Generate state
    const state = crypto.getRandomValues(new Uint8Array(16))
      .reduce((s, b) => s + b.toString(16).padStart(2, '0'), '');

    sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    sessionStorage.setItem('oauth_state', state);

    const clientId = process.env.NEXT_PUBLIC_DERIV_APP_ID || '1089';
    const authUrl = new URL('https://auth.deriv.com/oauth2/auth');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', 'trade account_manage');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');

    return { authorize_url: authUrl.toString(), state };
  },

  /** Link the account via Backend V2 Token Exchange. */
  async link(code: string, codeVerifier: string, state: string, accountId: string, currency: string, isVirtual: boolean): Promise<void> {
    await api.post("/api/v1/deriv/oauth/link", {
      code,
      code_verifier: codeVerifier,
      state,
      deriv_account_id: accountId,
      currency,
      is_virtual: isVirtual,
    });
  },

  async status(): Promise<AccountStatus> {
    const res = await api.get<AccountStatus>("/api/v1/deriv/account/status");
    return res.data;
  },

  async unlink(): Promise<void> {
    await api.delete("/api/v1/deriv/oauth");
  },
};

// ─── Orders: proposal → confirm ─────────────────────────────────────────────

/** Discriminated proposal body. `side` is the toggle's "rise"/"fall". */
/**
 * Order types.
 *
 * These are DERIVED from the generated models rather than re-declared. They used
 * to be hand-written copies, and the copies drifted: fields the backend returns
 * were missing from openapi.yaml, so someone added them to the GENERATED model
 * by hand — which every `npm run gen:api` silently reverted. The app kept
 * working only because this file happened to declare them too.
 *
 * The rule now: the wire shape comes from openapi.yaml, and anything narrower
 * is expressed as a refinement of the generated type, never as a second copy.
 */

/**
 * A proposal request, narrowed to the ids this frontend actually sends.
 *
 * The generated model types `contract_type` and `duration_unit` as plain
 * strings because that is all JSON can say. Narrowing them to the app's own
 * unions is the one thing worth keeping over the generated shape — it catches a
 * typo'd contract id at compile time instead of as a 422.
 */
export type ProposalRequest = Omit<
  GeneratedProposalRequest,
  "contract_type" | "side" | "duration_unit"
> & {
  contract_type: ContractTypeId;
  side?: "rise" | "fall";
  duration_unit?: "t" | "s" | "m" | "h" | "d";
};

/** The REST proposal response, exactly as openapi.yaml declares it. */
export type ProposalResponse = GeneratedProposalResponse;

/**
 * A frame from the live proposal WebSocket.
 *
 * Everything the REST response has, plus the stream-only additions
 * (`payout_choices`). Declared in openapi.yaml as ProposalStreamFrame, so this
 * shape is generated too — the WS payload no longer borrows the REST model and
 * no longer needs a field patched into it by hand.
 */
export type ProposalStreamFrame = GeneratedProposalStreamFrame;

export type ConfirmResponse = GeneratedConfirmResponse;

export const ordersApi = {
  /** Get a binding quote (~5s TTL). 422 = invalid params, 428 = no account. */
  async proposal(body: ProposalRequest): Promise<ProposalResponse> {
    const res = await api.post<ProposalResponse>(
      "/api/v1/orders/proposal",
      body,
    );
    return res.data;
  },

  /**
   * Execute the most recent proposal. The backend caps the buy at the quoted
   * price (slippage guard) and 410s if the 5s TTL has lapsed → caller should
   * re-quote and retry.
   */
  async confirm(proposalId: string): Promise<ConfirmResponse> {
    const res = await api.post<ConfirmResponse>("/api/v1/orders/confirm", {
      proposal_id: proposalId,
    });
    return res.data;
  },
};
