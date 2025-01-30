import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { StyledSwitch } from '../common/StyledSwitch';

interface NotificationSettingsProps {
  emailNotifications: boolean;
  pushNotifications: boolean;
  updatesNotifications: boolean;
  marketingNotifications: boolean;
  onEmailNotificationsChange: (checked: boolean) => void;
  onPushNotificationsChange: (checked: boolean) => void;
  onUpdatesNotificationsChange: (checked: boolean) => void;
  onMarketingNotificationsChange: (checked: boolean) => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  emailNotifications,
  pushNotifications,
  updatesNotifications,
  marketingNotifications,
  onEmailNotificationsChange,
  onPushNotificationsChange,
  onUpdatesNotificationsChange,
  onMarketingNotificationsChange,
}) => {
  const NotificationItem = ({ 
    title, 
    description, 
    checked, 
    onChange 
  }: { 
    title: string; 
    description: string; 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
  }) => (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Box>
        <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {description}
        </Typography>
      </Box>
      <StyledSwitch
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        inputProps={{ 'aria-label': `${title} toggle` }}
      />
    </Box>
  );

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
        Notifications
      </Typography>

      <NotificationItem
        title="Email Notifications"
        description="Receive email notifications about your account"
        checked={emailNotifications}
        onChange={onEmailNotificationsChange}
      />

      <NotificationItem
        title="Push Notifications"
        description="Receive push notifications about your account"
        checked={pushNotifications}
        onChange={onPushNotificationsChange}
      />

      <NotificationItem
        title="Updates Notifications"
        description="Receive updates notifications about your account"
        checked={updatesNotifications}
        onChange={onUpdatesNotificationsChange}
      />

      <NotificationItem
        title="Marketing Notifications"
        description="Receive marketing notifications about your account"
        checked={marketingNotifications}
        onChange={onMarketingNotificationsChange}
      />
    </Paper>
  );
};
