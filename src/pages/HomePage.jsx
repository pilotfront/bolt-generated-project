import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

function HomePage({ supabase }) {
  const { user } = useUserStore();
  const [profiles, setProfiles] = useState([]);
  const [index, setIndex] = useState(0);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    if (!user) return;

    const fetchProfiles = async () => {
      const { data: userProfile, error: userProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userProfileError) {
        console.error("Error fetching user profile:", userProfileError);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id);

      if (error) {
        console.error("Error fetching profiles:", error);
      } else {
        setProfiles(data);
      }

      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      if (matchesError) {
        console.error("Error fetching matches:", matchesError);
      } else {
        setMatches(matchesData);
      }
    };

    fetchProfiles();
  }, [supabase, user]);

  const handleSwipe = async (liked) => {
    if (!user) return;

    if (liked) {
      const likedUserId = profiles[index].id;

      const { data, error } = await supabase
        .from('likes')
        .insert([{ user_id: user.id, liked_user_id: likedUserId }]);

      if (error) {
        console.error("Error recording like:", error);
      }

      const { data: match1, error: matchError1 } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', likedUserId)
        .eq('liked_user_id', user.id);

      if (matchError1) {
        console.error("Error checking for match:", matchError1);
      } else if (match1 && match1.length > 0) {
        const { data: newMatch, error: newMatchError } = await supabase
          .from('matches')
          .insert([{ user1_id: user.id, user2_id: likedUserId }]);

        if (newMatchError) {
          console.error("Error creating match:", newMatchError);
        } else {
          setMatches([...matches, newMatch[0]]);
        }
      }
    }

    setIndex((prevIndex) => prevIndex + 1);
  };

  if (!user) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!profiles || profiles.length === 0) {
    return <div className="flex justify-center items-center h-screen">No profiles available.</div>;
  }

  if (index >= profiles.length) {
    return <div className="flex justify-center items-center h-screen">No more profiles to view.</div>;
  }

  const currentProfile = profiles[index];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.email}</h1>
      <div className="mb-4">
        <Link to="/profile" className="text-blue-500 hover:underline">Edit Profile</Link>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <img src={currentProfile.avatar_url} alt="Profile" className="w-full h-64 object-cover" />
        <div className="p-4">
          <h2 className="text-xl font-semibold">{currentProfile.full_name}</h2>
          <p className="text-gray-600">{currentProfile.bio}</p>
        </div>
      </div>
      <div className="flex justify-around mt-4">
        <button
          onClick={() => handleSwipe(false)}
          className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Reject
        </button>
        <button
          onClick={() => handleSwipe(true)}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Like
        </button>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Matches</h2>
        {matches.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {matches.map((match) => {
              const matchedUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
              const matchedProfile = profiles.find((profile) => profile.id === matchedUserId);

              if (!matchedProfile) {
                return null;
              }

              return (
                <li key={match.id} className="bg-white shadow-md rounded-lg overflow-hidden">
                  <Link to={`/chat/${match.id}`} className="block">
                    <img src={matchedProfile.avatar_url} alt="Matched Profile" className="w-full h-32 object-cover" />
                    <div className="p-2">
                      <h3 className="text-lg font-semibold">{matchedProfile.full_name}</h3>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No matches yet.</p>
        )}
      </div>
    </div>
  );
}

export default HomePage;
