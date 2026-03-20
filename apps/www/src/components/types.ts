import type { Dispatch, SetStateAction } from "react";

export type StateDispatcher<T> = Dispatch<SetStateAction<T>>;
