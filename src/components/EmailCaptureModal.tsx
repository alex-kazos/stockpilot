import React, { useState } from 'react';
import { X } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface EmailCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MessageState {
  type: 'success' | 'error' | '';
  text: string;
}

export default function EmailCaptureModal({ isOpen, onClose }: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<MessageState>({ type: '', text: '' });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      // Add email to Firestore waitlist collection
      await addDoc(collection(db, 'users/public/waitlist'), {
        email,
        plan: 'GROWTH',
        signupDate: Timestamp.now(),
        status: 'active'
      });

      setMessage({ type: 'success', text: 'Thank you! We\'ll notify you when the Growth plan becomes available.' });
      setEmail('');
      setTimeout(() => {
        onClose();
        setMessage({ type: '', text: '' });
      }, 3000);
    } catch (error) {
      console.error('Error adding to waitlist:', error);
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A27] rounded-xl p-6 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-2">Join the Waitlist</h3>
          <p className="text-gray-300">
            Be the first to know when our Growth plan becomes available. Get early access and exclusive offers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Join as a Founding Member for 50% off!"
              required
              className="w-full px-4 py-2 bg-[#12121E] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {message.text && (
            <div className={`text-sm ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Joining...' : 'Join Waitlist'}
          </button>
        </form>
      </div>
    </div>
  );
}
