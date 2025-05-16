"use cilent";
import { useContext } from "react";

import { AuthContext } from "@/components/provider";

export function useAuth() {
    const data = useContext(AuthContext);
    return data;
}
