import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import { useUserStore } from './store/userStore';

const supabaseUrl = 'https://syqyrcelljhhoqycqiyq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5cXlyY2VsbGpoaG9xeWNxaXlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwOTk5MzUsImV4cCI6MjA1NDY3NTkzNX0.Gz9kCLTNr2GXtpiS1hoCVwCZRf0LCIuCIl4x84ymUYY';
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const { setUser } = useUserStore();
  const [session, setSession] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setAuthError(error.message);
      }
      setSession(session);
      console.log("Initial session:", session);
      if (session) {
        setUser(session.user);
      }
    });

    supabase.auth.onAuthStateChange(async (_event, session, error) => {
      if (error) {
        setAuthError(error.message);
      }
      setSession(session);
      console.log("Auth state change session:", session);
      if (session) {
        setUser(session.user);

        // Create profile if it doesn't exist
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error checking profile:", profileError);
        }

        if (!profileData) {
          const { error: createProfileError } = await supabase
            .from('profiles')
            .insert([{ id: session.user.id, full_name: session.user.email, bio: 'Tell us about yourself!', avatar_url: '' }]);

          if (createProfileError) {
            console.error("Error creating profile:", createProfileError);
          } else {
            console.log("Profile created for new user");
          }
        }
      } else {
        setUser(null);
      }
    });
  }, [setUser]);

  const handleSignIn = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: provider });
    if (error) {
      setAuthError(error.message);
    }
  };

  return (
    <div className="App">
      <Routes>
        <Route
          path="/"
          element={session ? <HomePage supabase={supabase} /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={session ? <ProfilePage supabase={supabase} /> : <Navigate to="/login" />}
        />
        <Route
          path="/chat/:matchId"
          element={session ? <ChatPage supabase={supabase} /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={
            <div className="login-container">
              {authError && <div className="text-red-500 mb-4">{authError}</div>}
              <button onClick={() => handleSignIn('google')} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Sign in with Google
              </button>
              <button onClick={() => handleSignIn('github')} className="bg-gray-800 hover:bg-gray-900 text-white font-bold py-2 px-4 rounded ml-2">
                Sign in with GitHub
              </button>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
