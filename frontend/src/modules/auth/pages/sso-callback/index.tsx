import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL as string;

export default function SSOCallbackPage() {
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      navigate('/login');
      return;
    }

    fetch(`${API_URL}/auth/sso/us/exchange?code=${encodeURIComponent(code)}`)
      .then(res => {
        if (!res.ok) return res.json().then(d => Promise.reject(new Error(d.error)));
        return res.json();
      })
      .then(data => {
        login(
          {
            id: data.id,
            firstName: data.firstName,
            lastName: data.lastName,
            username: data.username,
            email: data.email,
            avatar: data.avatar,
          },
          data.token,
          new Date(data.tokenExpiration)
        );
        navigate('/');
      })
      .catch(err => {
        setError(err.message || 'Authentication failed. Please try again.');
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="flex w-[95dvw] max-w-[400px] flex-col items-center gap-6 rounded-lg bg-white p-8 shadow-[rgba(0,0,0,0.35)_0px_5px_15px]">
        <h1 className="text-center text-2xl font-extrabold text-sphere-grey-900">
          Universidad de Sevilla
        </h1>

        {error ? (
          <>
            <p className="text-center text-sm text-red-500">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full rounded-[20px] bg-teal-600 p-2 text-white shadow-[rgba(0,0,0,0.24)_0px_3px_8px] transition-colors hover:bg-teal-800"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
            <p className="text-center text-sm text-gray-500">
              Authenticating with Universidad de Sevilla...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
