"use client";

import * as React from "react";

import type { Dictionary } from "./dictionary.types";

const DictionaryContext = React.createContext<Dictionary | null>(null);

export function DictionaryProvider({
  dict,
  children,
}: {
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <DictionaryContext.Provider value={dict}>
      {children}
    </DictionaryContext.Provider>
  );
}

export function useDictionary(): Dictionary {
  const dict = React.useContext(DictionaryContext);

  if (!dict) {
    throw new Error("useDictionary must be used within a DictionaryProvider");
  }

  return dict;
}
