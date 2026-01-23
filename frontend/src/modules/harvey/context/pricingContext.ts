import { createContext } from "react";
import { PricingContextItem } from "../types/types";

export const PricingContext = createContext<PricingContextItem[] | null>(null)