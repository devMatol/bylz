import { useEffect, type ReactNode } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/Toast";

export function AdminPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    toast("Accès réservé", "danger");
    navigate("/", { replace: true });
  }, [toast, navigate]);

  return null;
}
