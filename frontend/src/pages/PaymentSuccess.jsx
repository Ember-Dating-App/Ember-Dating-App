import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useAuth, API } from '@/App';
import axios from 'axios';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [status, setStatus] = useState('loading');
  const [paymentDetails, setPaymentDetails] = useState(null);

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus('error');
    }
  }, [searchParams]);

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`, {
        headers,
        withCredentials: true
      });

      setPaymentDetails(response.data);

      if (response.data.payment_status === 'paid') {
        setStatus('success');
        // Refresh user data
        const meResponse = await axios.get(`${API}/auth/me`, { headers, withCredentials: true });
        setUser(meResponse.data);
      } else if (response.data.status === 'expired') {
        setStatus('expired');
      } else {
        // Continue polling
        setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" data-testid="payment-success-page">
      <div className="max-w-md w-full text-center">
        {status === 'loading' && (
          <div className="animate-fade-in">
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">Processing Payment</h1>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-fade-in">
            <div className="w-20 h-20 ember-gradient rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your purchase. Your account has been upgraded.
            </p>
            {paymentDetails && (
              <div className="bg-card rounded-xl p-4 mb-6 text-left border border-border/50">
                <p className="text-sm text-muted-foreground">Amount paid</p>
                <p className="text-lg font-bold">
                  ${(paymentDetails.amount_total / 100).toFixed(2)} {paymentDetails.currency?.toUpperCase()}
                </p>
              </div>
            )}
            <Button
              onClick={() => navigate('/discover')}
              className="ember-gradient rounded-full px-8"
              data-testid="continue-btn"
            >
              Start Discovering
            </Button>
          </div>
        )}

        {(status === 'error' || status === 'expired' || status === 'timeout') && (
          <div className="animate-fade-in">
            <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              {status === 'expired' ? 'Payment Expired' : 'Payment Failed'}
            </h1>
            <p className="text-muted-foreground mb-6">
              {status === 'timeout' 
                ? 'We couldn\'t confirm your payment. Please check your email for confirmation.'
                : 'Something went wrong with your payment. Please try again.'}
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => navigate('/discover')}
                className="rounded-full"
              >
                Go to Discover
              </Button>
              <Button
                onClick={() => navigate('/premium')}
                className="ember-gradient rounded-full"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
