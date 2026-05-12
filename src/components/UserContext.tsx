"use client";

import { createContext, useContext } from "react";

export type UserId = "hamza" | "iman";

export const UserContext = createContext<UserId>("hamza");

export function useUser(): UserId {
  return useContext(UserContext);
}

export function UserProvider({
  user,
  children,
}: {
  user: UserId;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
