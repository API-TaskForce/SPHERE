// LoginForm.tsx
import React from 'react';
import { validateLogin } from '../../utils/validators/login-validators';
import { loginUser } from '../../api/usersApi';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from '../../../core/hooks/useRouter';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL as string;

export type LoginFormProps = {
  loginField: string;
  password: string;
}

const LoginForm: React.FC = () => {

  const [errors, setErrors] = React.useState<string[]>([]);

  const {login} = useAuth();
  const router = useRouter();

  const handleSSOLogin = () => {
    window.location.href = `${API_URL}/auth/sso/us`;
  };

  const ssoErrorParam = new URLSearchParams(window.location.search).get('sso_error');
  const ssoErrors = ssoErrorParam
    ? ['Universidad de Sevilla SSO failed. Please try again or use your credentials.']
    : [];

  function handleLogin(e: any) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const formValues: LoginFormProps = {
      loginField: formData.get('loginField') as string,
      password: formData.get('password') as string,
    }

    const errors = validateLogin(formValues);
    
    if (errors.length > 0) {
      setErrors(errors);
    }else{
      loginUser(formValues)
        .then((response: any) => {

          if (response.error) {
            setErrors([response.error]);
            return;
          }

          const loggedUser = {
            id: response.id,
            firstName: response.firstName,
            lastName: response.lastName,
            username: response.username,
            email: response.email,
            avatar: response.avatar,
          }

          login(loggedUser, response.token, response.tokenExpiration);

          router.push('/');
        })
    }
  }
  
  return (
    <div className="flex h-[95dvh] max-h-[720px] w-[95dvw] max-w-[450px] flex-col items-center justify-center rounded-lg bg-white p-3 shadow-[rgba(0,0,0,0.35)_0px_5px_15px]">
      <h1 className="mb-4 text-center text-[30px] font-extrabold text-sphere-grey-900">
        Welcome back!
      </h1>
      
      {(errors.length > 0 || ssoErrors.length > 0) && (
        <div className="mb-2 w-full rounded-[20px] bg-[rgba(255,0,0,0.8)] p-2 text-center text-white">
          {[...ssoErrors, ...errors].map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )}

      <form
        onSubmit={handleLogin}
        className="mb-2 flex w-full flex-col gap-2"
      >
        <input
          placeholder="Username or Email"
          name="loginField"
          className="w-full rounded-[20px] border border-sphere-grey-300 px-4 py-2 outline-none focus:border-sphere-primary-700"
        />
        <input
          placeholder="Password"
          type="password"
          name="password"
          className="w-full rounded-[20px] border border-sphere-grey-300 px-4 py-2 outline-none focus:border-sphere-primary-700"
        />
        {/* <Link
          href="#"
          underline="hover"
          sx={{
            fontSize: "9px",
            fontWeight: 700,
            textAlign: "end",
            color: "#747474",
            cursor: "pointer",
            "&:hover": {
              color: "#000",
            },
          }}
        >
          Forgot Password?
        </Link> */}
        <button
          type="submit"
          className="w-full rounded-[20px] bg-teal-600 p-2 text-white shadow-[rgba(0,0,0,0.24)_0px_3px_8px] transition-colors hover:bg-teal-800"
        >
          Log in
        </button>
      </form>

      <p className="mb-2 text-center text-sm text-[#747474]">
        Don't have an account?{' '}
        <Link to="/register" className="cursor-pointer text-sm font-extrabold text-teal-600 underline">
          Sign up
        </Link>
      </p>

      <div className="flex items-center gap-3">
        <div className="flex-1 border-t border-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>

      <button
        type="button"
        onClick={handleSSOLogin}
        className="flex w-full items-center justify-center gap-3 rounded-[20px] border border-gray-300 bg-white p-2 shadow-sm transition-colors hover:bg-gray-50"
      >
        <svg
          className="h-5 w-5 flex-shrink-0"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="20" cy="20" r="20" fill="#007BC4" />
          <text
            x="50%"
            y="55%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            US
          </text>
        </svg>
        <span className="text-sm font-semibold text-gray-700">
          Login with Universidad de Sevilla
        </span>
      </button>

      {/* <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
        }}
      >
        <Button
          fullWidth
          startIcon={<AppleIcon />}
          sx={{
            backgroundColor: '#000',
            color: '#fff',
            borderRadius: '20px',
            p: 1,
            fontWeight: 500,
            '&:hover': { backgroundColor: '#333' },
            boxShadow: 'rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px',
          }}
        >
          Log in with Apple
        </Button>
        <Button
          fullWidth
          startIcon={<GoogleIcon />}
          sx={{
            border: '2px solid #747474',
            color: '#747474',
            borderRadius: '20px',
            p: 1,
            fontWeight: 500,
            '&:hover': { borderColor: '#555', color: '#555' },
          }}
        >
          Log in with Google
        </Button>
      </Box> */}
    </div>
  );
};

export default LoginForm;
