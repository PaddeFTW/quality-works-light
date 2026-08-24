"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AccountMenuProps {
  name?: string;
  email?: string;
  avatarUrl?: string;
  roleLabel?: string;
  className?: string;
}

export function AccountMenu({
  name: nameProp,
  email: emailProp,
  avatarUrl,
  roleLabel = "Användare",
  className,
}: AccountMenuProps) {
  const router = useRouter();
  const [name, setName] = useState(nameProp ?? "");
  const [email, setEmail] = useState(emailProp ?? "");

  useEffect(() => {
    if (nameProp && emailProp) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (!user) return;
      setEmail(user.email ?? "");
      setName(
        (user.user_metadata?.full_name as string | undefined) ||
          user.email?.split("@")[0] ||
          "Användare",
      );
    });
  }, [nameProp, emailProp]);

  const displayName = name || "Användare";
  const initials = displayName
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 rounded-full border bg-background/60 py-1 pl-1 pr-2 text-left transition-token hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[state=open]:bg-accent sm:pr-3",
          className,
        )}
      >
        <Avatar className="size-8">
          {avatarUrl ? <AvatarImage alt={displayName} src={avatarUrl} /> : null}
          <AvatarFallback className="bg-primary/12 text-xs font-semibold text-primary">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>
        <span className="hidden min-w-0 flex-col leading-tight sm:flex">
          <span className="truncate text-sm font-medium">{displayName}</span>
          <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
        </span>
        <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate text-sm font-medium">{displayName}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User />
            Profil
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            Inställningar
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} variant="destructive">
          <LogOut />
          Logga ut
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
