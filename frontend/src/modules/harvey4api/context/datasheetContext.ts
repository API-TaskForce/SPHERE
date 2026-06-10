import { createContext } from 'react';
import type { DatasheetContextItem } from '../types/types';

export const DatasheetContext = createContext<DatasheetContextItem[]>([]);
