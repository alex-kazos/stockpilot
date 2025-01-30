import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

export const CancelMembership: React.FC = () => {
  const { cancelMembership } = useAuth();
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleCancelMembership = async () => {
    if (confirmText === 'CANCEL') {
      try {
        await cancelMembership();
      } catch (error) {
        console.error('Error canceling membership:', error);
      }
    }
    setOpenDialog(false);
  };

  return (
    <Paper 
      sx={{ 
        p: 3,
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'error.dark'
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: 'error.light' }}>
        Cancel Membership
      </Typography>
      
      <Typography variant="body2" sx={{ color: 'error.light', mb: 2 }}>
        Once you cancel your membership, you'll have access until the end of your current billing cycle.
      </Typography>
      
      <Button 
        variant="contained" 
        color="error"
        onClick={() => setOpenDialog(true)}
        sx={{
          bgcolor: 'error.main',
          '&:hover': {
            bgcolor: 'error.dark',
          },
        }}
      >
        Cancel
      </Button>

      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2,
          }
        }}
      >
        <DialogTitle sx={{ color: 'text.primary' }}>
          Confirm Membership Cancellation
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2, color: 'text.primary' }}>
            This action cannot be will cancel your membership. Type "CANCEL" to confirm.
          </Typography>
          <TextField
            fullWidth
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type CANCEL to confirm"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'divider',
                },
                '&:hover fieldset': {
                  borderColor: 'error.light',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'error.main',
                },
              },
              '& .MuiInputBase-input': {
                color: 'text.primary',
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setOpenDialog(false)}
            sx={{ color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCancelMembership}
            color="error"
            disabled={confirmText !== 'CANCEL'}
            sx={{
              '&.Mui-disabled': {
                color: 'text.disabled',
              },
            }}
          >
            Cancel Membership
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};