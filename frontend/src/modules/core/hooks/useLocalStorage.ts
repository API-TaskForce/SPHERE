import { useState } from "react";
import CryptoJS from "crypto-js";

export const useLocalStorage = () => {
    const [value, setValue] = useState<string | null>(null);

    // in-memory fallback when localStorage is not available
    const memoryStorage = new Map<string, string>();

    const safeSetLocalStorage = (key: string, val: string) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.setItem(key, val);
                return true;
            }
        } catch (err) {
            // localStorage not available (e.g. in restricted iframe or file://)
        }
        memoryStorage.set(key, val);
        return false;
    };

    const safeGetLocalStorage = (key: string) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(key);
            }
        } catch (err) {
            // fall through
        }
        return memoryStorage.has(key) ? (memoryStorage.get(key) as string) : null;
    };

    const safeRemoveLocalStorage = (key: string) => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                window.localStorage.removeItem(key);
                return true;
            }
        } catch (err) {
            // fall through
        }
        memoryStorage.delete(key);
        return false;
    };

    const setItem = (key: string, value: string, _encrypt = true) => {
        let encryptedValue = value;
        if (_encrypt) {
            try {
                encryptedValue = CryptoJS.AES.encrypt(value, import.meta.env.VITE_SECRET_KEY as string).toString();
            } catch (err) {
                // If encryption fails, fall back to plain value
                encryptedValue = value;
            }
        }
        safeSetLocalStorage(key, encryptedValue);
        setValue(value);
    };

    const getItem = (key: string, _encrypt = true) => {
        let stored = safeGetLocalStorage(key);
        if (stored) {
            try {
                let decryptedValue = stored;
                if (_encrypt) {
                    decryptedValue = CryptoJS.AES.decrypt(stored, import.meta.env.VITE_SECRET_KEY as string).toString(CryptoJS.enc.Utf8);
                }
                setValue(decryptedValue);
                return decryptedValue;
            } catch (error) {
                console.error('Error decrypting localStorage item', error);
            }
        }
        setValue(stored);
        return stored;
    };

    const removeItem = (key: string) => {
        safeRemoveLocalStorage(key);
        setValue(null);
    };

  return { value, setItem, getItem, removeItem };
};