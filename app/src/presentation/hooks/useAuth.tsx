"use cilent";
import { useContext } from "react";

import { AuthContext } from "@/presentation/providers";

export function useAuth() {
  const data = useContext(AuthContext);
  return data;
}
