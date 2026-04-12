import { useContext, useEffect } from 'react'
import { useLocalStorage } from '../../core/hooks/useLocalStorage'
import { AuthContext } from '../contexts/authContext'
import { USERS_BASE_PATH } from '../api/usersApi'

// Module-level flag: shared across ALL useAuth instances in the same page session.
// Resets on full page reload (module re-executes). Prevents multiple concurrent
// tokenLogin calls when several components mount at the same time.
let authInitialized = false;

export interface AuthUserContext {
    user: AuthUser | null
    isAuthenticated: boolean
    token: string | null,
    tokenExpiration: Date | null,
    isLoading: boolean
}

export interface AuthUser {
    id: string
    firstName: string
    lastName: string
    username: string
    email: string
    avatar: string
}

export const useAuth = () => {
    const { authUser, setAuthUser } = useContext(AuthContext)
    const { getItem, setItem, removeItem } = useLocalStorage()

    const addUser = (user: AuthUser, token: string, tokenExpiration: Date) => {
        setAuthUser({
            user: user,
            isAuthenticated: true,
            token: token,
            tokenExpiration: tokenExpiration,
            isLoading: false,
        })
        setItem('token', token)
    }

    const removeUser = () => {
        authInitialized = false
        setAuthUser({
            user: null,
            isAuthenticated: false,
            token: null,
            tokenExpiration: null,
            isLoading: false,
        })
        removeItem('token')
    }

    useEffect(() => {
        // Guard: only one tokenLogin per page load, regardless of how many
        // components mount and call useAuth().
        if (authInitialized) return
        authInitialized = true

        const token = getItem('token')

        if (!token) {
            setAuthUser((prev) => ({
                ...prev,
                user: null,
                isAuthenticated: false,
                token: null,
                tokenExpiration: null,
                isLoading: false,
            }))
            removeItem('token')
            return
        }

        fetch(`${USERS_BASE_PATH}/tokenLogin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        })
            .then((response: Response) => {
                if (response.ok) {
                    response.json().then((dataResponse) => {
                        const user = dataResponse
                        addUser(
                            {
                                id: user.id,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                username: user.username,
                                email: user.email,
                                avatar: user.avatar,
                            },
                            user.token,
                            new Date(user.tokenExpiration)
                        )
                    })
                } else {
                    authInitialized = false
                    removeUser()
                }
            })
            .catch((_error) => {
                setTimeout(() => {
                    authInitialized = false
                    removeUser()
                }, 5000)
            })
    }, [])

    const login = (user: AuthUser, token: string, tokenExpiration: Date) => {
        addUser(user, token, tokenExpiration)
    }

    const logout = () => {
        removeUser()
    }

    const fetchWithInterceptor = async (
        url: RequestInfo | URL,
        options?: RequestInit,
        additionalHeaders?: Record<string, string>
    ) => {
        
        if (authUser.tokenExpiration) {
            const expirationTime = new Date(authUser.tokenExpiration).getTime()
            const currentTime = new Date().getTime()
            const timeDifference = expirationTime - currentTime

            if (timeDifference < 60*60*1000 && timeDifference > 0) { // 1 hour
                fetch(`${USERS_BASE_PATH}/tokenLogin`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token: authUser.token}),
                })
                    .then((response: Response) => {
                        if (response.ok) {
                            response.json().then((dataResponse) => {
                                const user = dataResponse
                                
                                let userData = {
                                    id: user.id,
                                    firstName: user.firstName,
                                    lastName: user.lastName,
                                    username: user.username,
                                    email: user.email,
                                    avatar: user.avatar,
                                    // plan: user.plan,
                                }
                                addUser(userData, user.token, user.tokenExpiration)
                            })
                        } else {
                            removeUser()
                        }
                    })
                    .catch((error) => {
                        console.error(error)
                        removeUser()
                    })
            }
        }
        
        const mergedOptions: RequestInit = additionalHeaders
            ? {
                  ...options,
                  headers: {
                      ...(options?.headers as Record<string, string>),
                      ...additionalHeaders,
                  },
              }
            : options ?? {};

        const response = await fetch(url, mergedOptions)

        return response
    }

    return { authUser, login, logout, setAuthUser, fetchWithInterceptor }
}
