import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSession, onAuthStateChange, signOut as authSignOut } from "../lib/auth";
import { supabase } from "../lib/supabase";
import type { Profile, Company } from "../types/database";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  company: Company | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    const load = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (error) return null;
      return data as Profile | null;
    };
    let result = await load();
    if (!result) {
      await new Promise((r) => setTimeout(r, 500));
      result = await load();
    }
    setProfile(result);
  }, []);

  const fetchCompany = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) {
      setCompany(null);
      return;
    }
    setCompany(data as Company | null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await Promise.all([fetchProfile(user.id), fetchCompany(user.id)]);
    }
  }, [user, fetchProfile, fetchCompany]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { session: currentSession, user: currentUser } = await getSession();
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentUser);
      if (currentUser) {
        await Promise.all([fetchProfile(currentUser.id), fetchCompany(currentUser.id)]);
      }
      setLoading(false);
    })();

    const { data: subscription } = onAuthStateChange((event, newSession) => {
      (async () => {
        const newUser = newSession?.user ?? null;
        setSession(newSession);
        setUser(newUser);
        if (newUser) {
          await Promise.all([fetchProfile(newUser.id), fetchCompany(newUser.id)]);
        } else {
          setProfile(null);
          setCompany(null);
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [fetchProfile, fetchCompany]);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setCompany(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, session, profile, company, loading, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
