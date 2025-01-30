import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, CircularProgress, Link, Chip } from '@mui/material';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { subscriptionService, Subscription, PRICE_IDS, SUBSCRIPTION_URLS } from '../../services/subscriptionService';

interface PlanDetails {
  features: string[];
  subscriptionId: string;
  title: string;
  price: number;
}

const planDetails: Record<'monthly' | 'yearly', PlanDetails> = {
  monthly: {
    title: 'StockPilot Monthly',
    subscriptionId: 'monthly-plan',
    price: 295,
    features: []
  },
  yearly: {
    title: 'StockPilot Yearly',
    subscriptionId: 'yearly-plan',
    price: 235,
    features: []
  }
};

export const SubscriptionSettings: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeSubscription, setActiveSubscription] = useState<{
    type: 'monthly' | 'yearly';
    status: 'active' | 'expired' | 'cancelled';
    renewsAt: Date | null;
  } | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);

  useEffect(() => {
    const fetchSubscription = async () => {
      if (user?.email) {
        try {
          const sub = await subscriptionService.getUserSubscription(user.email);
          setSubscription(sub);
          if (sub) {
            setActiveSubscription({
              type: sub.priceId === PRICE_IDS.MONTHLY ? 'monthly' : 'yearly',
              status: sub.status,
              renewsAt: sub.renewsAt
            });
          }
        } catch (error) {
          console.error('Error fetching subscription:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchSubscription();
  }, [user?.email]);

  const handleSwitchPlan = async (planType: 'monthly' | 'yearly') => {
    // Here you would implement the logic to switch plans
    console.log(`Switching to ${planType} plan`);
  };

  const handleManageSubscription = (plan: 'monthly' | 'yearly') => {
    window.open(subscriptionService.getSubscriptionUrl(subscription, plan), '_blank');
  };

  const handlePortalAccess = () => {
    window.open(SUBSCRIPTION_URLS.MANAGE_SUBSCRIPTION, '_blank');
  };

  const getSubscriptionStatusChip = () => {
    if (!subscription) return null;
    
    let color: 'success' | 'warning' | 'error' | 'default' = 'default';
    let label = subscription.status;

    switch (subscription.status) {
      case 'active':
        color = 'success';
        label = 'Active';
        break;
      case 'trialing':
        color = 'warning';
        label = 'Trial';
        break;
      case 'canceled':
        color = 'error';
        label = 'Canceled';
        break;
      case 'past_due':
        color = 'error';
        label = 'Past Due';
        break;
    }

    return (
      <Chip 
        label={label}
        color={color}
        size="small"
        sx={{ ml: 2 }}
      />
    );
  };

  const isActivePlan = (planType: 'monthly' | 'yearly') => {
    if (!subscription || !subscription.priceId) return false;
    return planType === 'monthly' 
      ? subscription.priceId === PRICE_IDS.MONTHLY
      : subscription.priceId === PRICE_IDS.YEARLY;
  };

  const PlanCard = ({ planType }: { planType: 'monthly' | 'yearly' }) => {
    const plan = planDetails[planType];
    const isMonthly = planType === 'monthly';

    return (
      <Paper
        sx={{
          p: 4,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: isActivePlan(planType) ? '2px solid #6366F1' : '1px solid #e0e0e0',
          borderRadius: 2,
          bgcolor: 'background.paper',
          height: '100%',
          minHeight: 320,
          position: 'relative',
          '&:hover': {
            bgcolor: '#1A1B23',
            transition: 'background-color 200ms ease-in-out',
          }
        }}
      >
        {isActivePlan(planType) && (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: '#6366F1',
              color: 'white',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: '0.75rem',
            }}
          >
            Current Plan
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ color: 'text.primary' }}>
              {plan.title}
            </Typography>
          </Box>
          {planType === 'yearly' && (
            <Typography
              variant="body2"
              sx={{
                bgcolor: 'success.main',
                color: 'white',
                px: 2,
                py: 0.5,
                borderRadius: 10,
                fontSize: '0.75rem',
                fontWeight: 500,
                whiteSpace: 'nowrap'
              }}
            >
              Save 228€
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h3" sx={{ color: 'text.primary', display: 'flex', alignItems: 'baseline', gap: 1 }}>
            €{plan.price}
            <Typography component="span" variant="h6" sx={{ color: 'text.secondary' }}>
              /month
            </Typography>
          </Typography>
          {planType === 'yearly' && (
            <Typography variant="body2" sx={{ color: '#6366F1', mt: 1 }}>
              €{plan.price * 12} billed yearly
            </Typography>
          )}
        </Box>

        <Button
          variant={isActivePlan(planType) ? "outlined" : "contained"}
          fullWidth
          disabled={isActivePlan(planType)}
          onClick={() => handleManageSubscription(planType)}
          sx={{
            color: isActivePlan(planType) ? 'text.primary' : 'white',
            borderColor: isActivePlan(planType) ? 'primary.main' : 'transparent',
            bgcolor: !isActivePlan(planType) && (isMonthly ? '#1A1B23' : '#34384C'),
            '&:hover': {
              bgcolor: !isActivePlan(planType) && (isMonthly ? '#1A1B23' : '#34384C'),
              opacity: !isActivePlan(planType) ? 0.9 : 1,
              transition: 'background-color 200ms ease-in-out'
            },
            mt: 'auto',
            py: 2,
            textTransform: 'none',
            fontSize: '1rem',
            borderRadius: 2
          }}
        >
          {isActivePlan(planType) ? 'Current Plan' : 'Switch Plan'}
        </Button>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper 
      sx={{ 
        p: 3,
        bgcolor: '#1C1B23',
        borderRadius: 2,
        border: '1px solid',
        borderColor: '#34384C',
        '&:hover': {
          bgcolor: '#1A1B23',
          transition: 'background-color 200ms ease-in-out',
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: 'white' }}>
          Subscription
        </Typography>
        {getSubscriptionStatusChip()}
      </Box>
      <Link
        component="button"
        variant="body2"
        onClick={handlePortalAccess}
        sx={{
          color: '#6366F1',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          }
        }}
      >
        Manage your subscription
      </Link>
      <Box sx={{ display: 'flex', gap: 3, mt: 3 }}>
        <PlanCard planType="monthly" />
        <PlanCard planType="yearly" />
      </Box>
    </Paper>
  );
};
