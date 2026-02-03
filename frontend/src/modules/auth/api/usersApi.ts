import { LoginFormProps } from "../components/login-form";
import { RegisterFormProps } from "../components/register-form";

export const USERS_BASE_PATH = import.meta.env.VITE_API_URL + "/users";

export async function loginUser(formData: LoginFormProps): Promise<any> {
    try {
        const response = await fetch(`${USERS_BASE_PATH}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        const parsedResponse = await response.json().catch(() => null);

        if (!response.ok) {
            // Prefer server-provided message when available
            const message = parsedResponse && parsedResponse.error ? parsedResponse.error : 'Login failed';
            throw new Error(message);
        }

        return parsedResponse;
    } catch (error: any) {
        console.error("Error during login request:", error);
        throw error;
    }
} 

export function registerUser(formData: RegisterFormProps, setErrors: Function = () => {}): Promise<any> {
    return fetch(`${USERS_BASE_PATH}/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
    }).then(async (response) => {

        const parsedResponse = await response.json();

        if (!response.ok) {
            throw new Error(parsedResponse.error);
        }
        
        return parsedResponse;
    })
    .catch((error: Error) => {
        if (Array.isArray(error)) {
            setErrors(error);
        }else{
            setErrors([error.message]);
        }
    });
}