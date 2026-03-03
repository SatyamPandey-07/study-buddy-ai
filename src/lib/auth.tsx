import { ClerkProvider, SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAuthToken, setAuthTokenGetter, adminAPI } from './api';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  console.warn('Missing Clerk Publishable Key. Authentication will not work.');
}

// Auth wrapper component to sync tokens
function AuthTokenSync({ children }: { children: React.ReactNode }) {
  const { getToken, isSignedIn } = useAuth();

  useEffect(() => {
    // Register token getter for fresh tokens on each request
    setAuthTokenGetter(async () => {
      try {
        return await getToken();
      } catch (error) {
        console.error('Failed to get token:', error);
        return null;
      }
    });
    
    const syncToken = async () => {
      try {
        const token = await getToken();
        setAuthToken(token);
      } catch (error) {
        console.error('Failed to sync auth token:', error);
        setAuthToken(null);
      }
    };

    if (isSignedIn) {
      syncToken();
    } else {
      setAuthToken(null);
    }
  }, [getToken, isSignedIn]);

  return <>{children}</>;
}

export function AppWithAuth({ children }: { children: React.ReactNode }) {
  if (!PUBLISHABLE_KEY) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <AuthTokenSync>
        {children}
      </AuthTokenSync>
    </ClerkProvider>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkAuth = async () => {
      const signedOut = document.querySelector('[data-clerk-signed-out]');
      if (signedOut) {
        navigate('/sign-in', { replace: true });
      }
    };
    checkAuth();
  }, [navigate]);
  
  return (
    <>
      <SignedIn>
        {children}
      </SignedIn>
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </SignedOut>
    </>
  );
}

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      navigate('/sign-in', { replace: true });
      return;
    }
    adminAPI.check()
      .then(() => setChecking(false))
      .catch(() => navigate('/dashboard', { replace: true }));
  }, [isLoaded, isSignedIn, navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
