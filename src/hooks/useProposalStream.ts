"use client";

import { useEffect, useRef, useState } from "react";
import {
  ordersApi,
  type ConfirmResponse,
  type ProposalRequest,
  type ProposalStreamFrame,
} from "@/services/tradingApi";
import { buildWsUrl } from "@/services/ws";
import { useAuthStore } from "@/stores/authStore";

interface UseProposalStreamOptions {
  enabled?: boolean;
}

interface UseProposalStreamResult {
  proposal: ProposalStreamFrame | null;
  /**
   * Payout-per-point choices, held separately because they can arrive without a
   * proposal (notably after a proposal error). Prefer proposal.payout_choices
   * when a proposal exists; fall back to this otherwise.
   */
  payoutChoices: string[] | undefined;
  loading: boolean;
  error: string | null;
  confirm: () => Promise<ConfirmResponse>;
}

export function useProposalStream(
  request: ProposalRequest | null,
  { enabled = true }: UseProposalStreamOptions = {},
): UseProposalStreamResult {
  const [proposal, setProposal] = useState<ProposalStreamFrame | null>(null);
  const [payoutChoices, setPayoutChoices] = useState<string[] | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authStatus = useAuthStore((s) => s.status);

  const requestRef = useRef<ProposalRequest | null>(request);
  const proposalRef = useRef<ProposalStreamFrame | null>(null);
  requestRef.current = request;
  proposalRef.current = proposal;

  const key = request ? JSON.stringify(request) : null;
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    if (!enabled || !request || authStatus !== "authenticated") {
      setProposal(null);
      setLoading(false);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    setLoading(true);
    setError(null);

    let reconnectAttempts = 0;
    let isCleanedUp = false;

    const connect = () => {
      if (isCleanedUp) return;

      const ws = new WebSocket(buildWsUrl("/ws/proposal"));
      wsRef.current = ws;

      let pingInterval: ReturnType<typeof setInterval>;

      ws.onopen = () => {
        if (isCleanedUp) {
          ws.close();
          return;
        }
        reconnectAttempts = 0;
        setError(null);
        ws.send(JSON.stringify(requestRef.current));
        
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        if (isCleanedUp) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "proposal") {
            setProposal(data as ProposalStreamFrame);
            setLoading(false);
            setError(null);
          } else if (data.type === "payout_choices") {
            // A payout_choices frame can arrive without a proposal — after a
            // proposal error Deriv still sends the available choices, so the
            // dropdown can populate.
            //
            // Kept in its own state rather than fabricated into a proposal.
            // Casting `{ payout_choices }` to a proposal leaves every other
            // field undefined behind a type that promises a string, which
            // surfaced downstream as "Payout NaN undefined".
            setPayoutChoices(data.payout_choices as string[]);
            setProposal((prev) =>
              prev ? { ...prev, payout_choices: data.payout_choices } : prev,
            );
          } else if (data.type === "error") {
            setError(data.message || "Unknown error");
            setLoading(false);
          }
        } catch (err) {
          console.error("Failed to parse proposal stream message:", err);
        }
      };

      ws.onclose = () => {
        clearInterval(pingInterval);
        if (!isCleanedUp && reconnectAttempts < 5) {
          const delay = Math.pow(2, reconnectAttempts) * 1000;
          setTimeout(connect, delay);
          reconnectAttempts++;
        }
      };
      
      ws.onerror = () => {
        if (!isCleanedUp) {
          setError("Stream connection error");
        }
      };
    };

    connect();

    return () => {
      isCleanedUp = true;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [key, enabled, authStatus]);

  const confirm = async (): Promise<ConfirmResponse> => {
    let current = proposalRef.current;
    if (!current) throw new Error("No pending request.");
    try {
      return await ordersApi.confirm(current.proposal_id);
    } catch (e) {
      if (statusOf(e) === 410 && requestRef.current) {
        // Fallback to one-shot fetch for a fresh quote if the stream quote expired
        const fresh = await ordersApi.proposal(requestRef.current);
        setProposal(fresh);
        proposalRef.current = fresh;
        current = fresh;
        return await ordersApi.confirm(fresh.proposal_id);
      }
      throw e;
    }
  };

  return { proposal, payoutChoices, loading, error, confirm };
}

function statusOf(e: unknown): number | undefined {
  return (e as { response?: { status?: number } })?.response?.status;
}
