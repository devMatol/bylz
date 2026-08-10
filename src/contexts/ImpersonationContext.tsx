import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { Profile, Company } from "../types/database";

interface ImpersonationState {
  isImpersonating: boolean;
  sessionId: string | null;
  targetUser: Profile | null;
  targetCompany: Company | null;
  expiresAt: string | null;
  remainingSeconds: number;
}

interface ImpersonationContextValue extends ImpersonationState {
  startImpersonation: (adminId: string, targetUserId: string) => Promise<boolean>;
  stopImpersonation: () => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationContextValue | null>(null);

const SESSION_STORAGE_KEY = "bylz_impersonation_session";

export function ImpersonationProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [targetUser, setTargetUser] = useState<Profile | null>(null);
  const [targetCompany, setTargetCompany] = useState<Company | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const stopImpersonation = useCallback(async () => {
    if (sessionId) {
      try {
        // The server closes the session, verifies it belongs to the calling
        // administrator, and records the action itself.
        await supabase.rpc("admin_end_impersonation", { p_session: sessionId });
      } catch (err) {
        console.error("Error closing impersonation session:", err);
      }
    }

    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    setSessionId(null);
    setTargetUser(null);
    setTargetCompany(null);
    setExpiresAt(null);
    setRemainingSeconds(0);
  }, [sessionId]);

  const loadSessionDetails = useCallback(async (sessId: string, expAt: string, targetUid: string) => {
    try {
      const [{ data: prof }, { data: comp }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", targetUid).maybeSingle(),
        supabase.from("companies").select("*").eq("user_id", targetUid).maybeSingle(),
      ]);

      if (prof) setTargetUser(prof as Profile);
      if (comp) setTargetCompany(comp as Company);
      setSessionId(sessId);
      setExpiresAt(expAt);
    } catch (err) {
      console.error("Error loading impersonated details:", err);
    }
  }, []);

  const startImpersonation = useCallback(
    async (_adminId: string, targetUserId: string): Promise<boolean> => {
      try {
        // The server verifies the caller is an administrator, sets the expiry
        // itself and records the action.
        const { data, error: sessErr } = await supabase.rpc("admin_start_impersonation", {
          p_target: targetUserId,
        });

        const sess = (Array.isArray(data) ? data[0] : data) as
          | { session_id: string; expires_at: string }
          | undefined;

        if (sessErr || !sess?.session_id) {
          console.error("Failed to create impersonation session:", sessErr);
          return false;
        }

        const expires = new Date(sess.expires_at).toISOString();

        sessionStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({ sessionId: sess.session_id, expiresAt: expires, targetUserId })
        );

        await loadSessionDetails(sess.session_id, expires, targetUserId);
        return true;
      } catch (err) {
        console.error("Error starting impersonation:", err);
        return false;
      }
    },
    [loadSessionDetails]
  );

  // Restore session from sessionStorage on load
  useEffect(() => {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const expTime = new Date(parsed.expiresAt).getTime();
        if (expTime > Date.now()) {
          void loadSessionDetails(parsed.sessionId, parsed.expiresAt, parsed.targetUserId);
        } else {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
  }, [loadSessionDetails]);

  // Countdown timer effect
  useEffect(() => {
    if (!expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000);
      if (diff <= 0) {
        setRemainingSeconds(0);
        void stopImpersonation();
      } else {
        setRemainingSeconds(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, stopImpersonation]);

  const isImpersonating = !!sessionId && !!targetUser && remainingSeconds > 0;

  return (
    <ImpersonationContext.Provider
      value={{
        isImpersonating,
        sessionId,
        targetUser,
        targetCompany,
        expiresAt,
        remainingSeconds,
        startImpersonation,
        stopImpersonation,
      }}
    >
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation() {
  const ctx = useContext(ImpersonationContext);
  if (!ctx) {
    throw new Error("useImpersonation must be used within ImpersonationProvider");
  }
  return ctx;
}
