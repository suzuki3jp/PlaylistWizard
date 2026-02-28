"use client";
import { UserCircle } from "lucide-react";
import Image from "next/image";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FocusedAccount } from "../atoms/focused-account";
import { useFocusedAccount } from "../atoms/focused-account";
import { useAccountsQuery } from "../queries/use-accounts";

interface AccountTabsProps {
  value?: string;
  onValueChange?: (account: FocusedAccount) => void;
}

export function AccountTabs({ value, onValueChange }: AccountTabsProps = {}) {
  const { data: accounts } = useAccountsQuery();
  const [focusedAccount, setFocusedAccount] = useFocusedAccount();

  if (!accounts || accounts.length < 2) return null;

  const controlledValue = value ?? focusedAccount?.id ?? "";
  const handleChange = (id: string) => {
    const acc = accounts.find((a) => a.id === id);
    if (!acc) return;
    if (onValueChange) onValueChange(acc);
    else setFocusedAccount(acc);
  };

  return (
    <Tabs value={controlledValue} onValueChange={handleChange}>
      <TabsList variant="line">
        {accounts.map((acc) => (
          <TabsTrigger key={acc.id} value={acc.id}>
            {acc.image ? (
              <Image
                src={acc.image}
                alt={acc.name ?? acc.email ?? ""}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <UserCircle className="size-5" />
            )}
            {acc.name ?? acc.email}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
