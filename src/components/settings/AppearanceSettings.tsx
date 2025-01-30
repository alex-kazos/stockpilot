import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { StyledSwitch } from '../common/StyledSwitch';

interface AppearanceSettingsProps {
  darkMode: boolean;
  onDarkModeChange: (checked: boolean) => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  darkMode,
  onDarkModeChange,
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
      <Typography variant="h6" sx={{ color: 'text.primary', mb: 3 }}>
        Appearance
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>
            Dark Mode
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Toggle dark mode theme
          </Typography>
        </Box>
        <StyledSwitch
          checked={darkMode}
          onChange={(e) => onDarkModeChange(e.target.checked)}
          inputProps={{ 'aria-label': 'Dark mode toggle' }}
        />
      </Box>
    </Paper>
  );
};
