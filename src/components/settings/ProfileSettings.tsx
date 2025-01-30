import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export function ProfileSettings() {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.displayName || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateProfile = async () => {
    try {
      await updateProfile({ displayName: fullName });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <div className="bg-[#1C1B23] border-2 border-gray-800 rounded-lg p-6 hover:bg-[#1A1B23] transition-all duration-200 ease-in-out">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
          <p className="text-gray-400 text-sm mt-1">Manage your profile information</p>
        </div>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-[#2A2D3E] text-gray-300 rounded-lg hover:bg-[#1A1B23] transition-all duration-200 ease-in-out"
        >
          {isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            disabled={!isEditing}
            className="w-full bg-[#1C1B23] border-2 border-gray-800 rounded-lg px-4 py-2 text-gray-300 disabled:opacity-50 focus:outline-none focus:border-[#383B4D] hover:bg-[#1A1B23] transition-all duration-200 ease-in-out"
          />
        </div>
      </div>
    </div>
  );
}
