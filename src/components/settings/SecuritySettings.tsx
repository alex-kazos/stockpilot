import React from 'react';
import { Box, Paper, Typography, Button, Link } from '@mui/material';
import { StyledSwitch } from '../common/StyledSwitch';

interface SecuritySettingsProps {
  twoFactorEnabled: boolean;
  onTwoFactorChange: (checked: boolean) => void;
  onChangePassword: () => void;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  twoFactorEnabled,
  onTwoFactorChange,
  onChangePassword,
}) => {
  return (
    <Paper 
      sx={{ 
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: 'text.primary' }}>
        Security
      </Typography>
      
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>
              Two-Factor Authentication
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Add an extra layer of security to your account
            </Typography>
          </Box>
          <StyledSwitch
            checked={twoFactorEnabled}
            onChange={(e) => onTwoFactorChange(e.target.checked)}
            inputProps={{ 'aria-label': 'Two-factor authentication toggle' }}
          />
        </Box>
        
        <Link 
          href="#" 
          underline="none"
          sx={{ 
            color: 'primary.main',
            '&:hover': {
              color: 'primary.light',
            },
          }}
        >
          <Button 
            variant="text"
            onClick={onChangePassword}
            sx={{ 
              color: 'inherit',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            Change Password
          </Button>
        </Link>
      </Box>
    </Paper>
  );
};
