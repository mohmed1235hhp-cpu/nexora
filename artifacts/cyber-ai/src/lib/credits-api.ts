/**
 * Local credits API hooks. The generated @workspace/api-client-react client
 * does not yet expose credits endpoints, so we implement thin wrappers here.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { csrfHeaders } from "@/lib/csrf";

type CreditsResponse = {
  balance: number;
  maxDaily: number;
  used: number;
  resetAt: string;
  plan: string;
};

type UseCreditsBody = {
  toolName: string;
  toolLabel: string;
  creditsUsed: number;
  prompt?: string;
};

async function fetchCredits(): Promise<CreditsResponse> {
  const res = await fetch("/api/credits", { credentials: "include" });
  if (!res.ok) throw new Error(`credits ${res.status}`);
  return res.json();
}

async function postUseCredits(body: UseCreditsBody): Promise<CreditsResponse> {
  const res = await fetch("/api/credits/use", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...csrfHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`use-credits ${res.status}`);
  return res.json();
}

export function useGetCredits(opts?: { query?: { refetchOnWindowFocus?: boolean; retry?: boolean | number } }) {
  return useQuery({
    queryKey: ["credits"],
    queryFn: fetchCredits,
    refetchOnWindowFocus: opts?.query?.refetchOnWindowFocus,
    retry: opts?.query?.retry,
  });
}

export function useUseCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { data: UseCreditsBody }) => postUseCredits(vars.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["credits"] });
    },
  });
}
