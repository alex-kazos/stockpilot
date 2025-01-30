import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService, Subscription } from '../../services/subscriptionService';
import { Dialog, DialogContent, DialogTitle, Button, Box, Typography, Stack } from '@mui/material';

interface SubscriptionCheckProps {
  children: React.ReactNode;
}

export const SubscriptionCheck: React.FC<SubscriptionCheckProps> = ({ children }) => {
  const { user, signOut } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const checkSubscription = async () => {
      if (user?.email) {
        const sub = await subscriptionService.getUserSubscription(user.email);
        setSubscription(sub);
        if (!subscriptionService.isSubscriptionActive(sub)) {
          setShowDialog(true);
        }
      }
      setLoading(false);
    };

    checkSubscription();
  }, [user]);

  const handleManageSubscription = () => {
    window.open(subscriptionService.getSubscriptionUrl(subscription), '_blank');
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (subscriptionService.isSubscriptionActive(subscription)) {
    return <>{children}</>;
  }

  return (
    <>
      <Dialog open={showDialog} onClose={() => {}} maxWidth="sm" fullWidth>
        <DialogTitle>
          {subscriptionService.wasCustomer(subscription) 
            ? "Subscription Inactive" 
            : "Subscribe to StockPilot"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {subscriptionService.wasCustomer(subscription)
                ? "Your subscription isn't active. Please check your subscription to continue using StockPilot."
                : "Please subscribe to start using StockPilot."}
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleManageSubscription}
              >
                {subscriptionService.wasCustomer(subscription)
                  ? "Manage Subscription"
                  : "Subscribe Now"}
              </Button>
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={handleLogout}
              >
                Log Out
              </Button>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};
