"use client";
import { useCallback, useState } from "react";

export function useFetchState<S>(
  defaultState: S,
  defaultLoading = true,
): [loading: boolean, state: S, setAsFetched: (state: S) => void] {
  const [loading, setLoading] = useState(defaultLoading);
  const [state, setState] = useState(defaultState);

  const setAsFetched = useCallback((state: S) => {
    setState(state);
    setLoading(false);
  }, []);

  return [loading, state, setAsFetched];
}
