import { useState } from "react";
import type { Company } from "../types/database";

export function useCompany() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  return { company, setCompany, loading, setLoading, error, setError };
}
