import React, { useState } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export const EmailSettings: React.FC = () => {
  const { user, updateEmail } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateEmail = async () => {
    try {
      await updateEmail(email);
    } catch (error) {
      console.error('Error updating email:', error);
    }
  };

  return (
    <Paper 
      sx={{ 
        p: 3,
        bgcolor: '#1C1B23',
        borderRadius: 2,
        border: '2px solid',
        borderColor: '#2A2D3E',
        '&:hover': {
          bgcolor: '#1A1B23',
        },
        transition: 'all 0.2s ease-in-out',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: 'white' }}>
        Email Settings
      </Typography>
      
      <Box sx={{ mt: 2 }}>
        <TextField
          fullWidth
          type="email"
          label="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ 
            mb: 2,
            bgcolor: '#1C1B23',
            border: '2px solid',
            borderColor: '#2A2D3E',
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#2A2D3E',
              },
              '&:hover fieldset': {
                borderColor: '#383B4D',
              },
            },
            '& .MuiInputLabel-root': {
              color: 'gray',
            },
            '& .MuiInputBase-input': {
              color: 'white',
            },
            '&:hover': {
              bgcolor: '#1A1B23',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        />
        
        <Button 
          variant="contained" 
          onClick={handleUpdateEmail}
          sx={{
            bgcolor: '#2A2D3E',
            '&:hover': {
              bgcolor: '#383B4D',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          Update Email
        </Button>
        
        <Button 
          variant="outlined" 
          onClick={() => setIsEditing(!isEditing)}
          sx={{
            ml: 2,
            bgcolor: '#2A2D3E',
            '&:hover': {
              bgcolor: '#1A1B23',
              color: 'white',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {isEditing ? 'Save Changes' : 'Edit Settings'}
        </Button>
      </Box>
    </Paper>
  );
};
