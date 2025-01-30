import React from 'react';
import { Box, Paper, Typography, Select, MenuItem, SelectChangeEvent } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

interface LanguageSettingsProps {
  language: string;
  onLanguageChange: (language: string) => void;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'el', name: 'Greek' }
];

export const LanguageSettings: React.FC<LanguageSettingsProps> = ({
  language,
  onLanguageChange,
}) => {
  const handleChange = (event: SelectChangeEvent) => {
    onLanguageChange(event.target.value);
  };

  const selectedLanguage = languages.find(lang => lang.code === language)?.name || 'English';

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
        Language & Region
      </Typography>

      <Box>
        <Typography 
          variant="body2" 
          sx={{ 
            color: 'primary.main',
            mb: 1,
            fontWeight: 500
          }}
        >
          Language
        </Typography>
        <Select
          value={language}
          onChange={handleChange}
          fullWidth
          displayEmpty
          renderValue={() => selectedLanguage}
          IconComponent={KeyboardArrowDownIcon}
          sx={{
            height: '56px',
            bgcolor: '#1A1B23',
            borderRadius: 2,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6B7AFF',
              borderWidth: '1px',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6B7AFF',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6B7AFF',
            },
            '& .MuiSelect-icon': {
              color: 'text.secondary',
              right: 16,
            },
            '& .MuiSelect-select': {
              color: 'text.primary',
              fontSize: '1rem',
              paddingLeft: '16px',
            },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: '#1A1B23',
                borderRadius: 2,
                border: '1px solid',
                borderColor: '#6B7AFF',
                mt: 1,
                '& .MuiMenuItem-root': {
                  color: 'text.primary',
                  py: 1.5,
                  '&:hover': {
                    bgcolor: 'rgba(107, 122, 255, 0.1)',
                  },
                  '&.Mui-selected': {
                    bgcolor: 'rgba(107, 122, 255, 0.2)',
                    '&:hover': {
                      bgcolor: 'rgba(107, 122, 255, 0.3)',
                    },
                  },
                },
              },
            },
          }}
        >
          {languages.map((lang) => (
            <MenuItem key={lang.code} value={lang.code}>
              {lang.name}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Paper>
  );
};
