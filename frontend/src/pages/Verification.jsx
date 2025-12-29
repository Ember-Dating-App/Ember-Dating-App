import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Camera, Phone, IdCard, Check, ArrowLeft } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const VerificationWizard = () => {
  const [step, setStep] = useState('intro');
  const [completedMethods, setCompletedMethods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const idInputRef = useRef(null);

  const handlePhotoVerification = async () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        
        const token = localStorage.getItem('token');
        await axios.post(
          `${API_BASE}/api/verification/photo`,
          { selfie_data: base64 },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setCompletedMethods([...completedMethods, 'photo']);
        setStep('success');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.response?.data?.detail || 'Photo upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/api/verification/phone/send`,
        { phone: phoneNumber },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCodeSent(true);
      // Show debug code in development
      if (response.data.debug_code) {
        alert(`Verification code: ${response.data.debug_code}`);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_BASE}/api/verification/phone/verify`,
        { phone: phoneNumber, code: verificationCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCompletedMethods([...completedMethods, 'phone']);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleIDUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result;
        
        const token = localStorage.getItem('token');
        await axios.post(
          `${API_BASE}/api/verification/id`,
          { id_photo_data: base64 },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setCompletedMethods([...completedMethods, 'id']);
        setStep('success');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.response?.data?.detail || 'ID upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    navigate('/profile-setup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-['Orbitron'] text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 mb-2">
            EMBER
          </h1>
          <p className="text-gray-600">Profile Verification</p>
        </div>

        {/* Intro Step */}
        {step === 'intro' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Ember!</h2>
            <p className="text-gray-600 mb-6">
              To keep our community safe, we require all users to verify their profile. 
              You need to complete <strong>at least one</strong> verification method to continue.
            </p>

            <div className="space-y-4">
              {/* Photo Verification */}
              <button
                onClick={() => setStep('photo')}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                  <Camera className="w-6 h-6 text-orange-600 group-hover:text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-800">Photo Verification</h3>
                  <p className="text-sm text-gray-500">Upload a selfie</p>
                </div>
                {completedMethods.includes('photo') && (
                  <Check className="w-6 h-6 text-green-500" />
                )}
              </button>

              {/* Phone Verification */}
              <button
                onClick={() => setStep('phone')}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                  <Phone className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-800">Phone Verification</h3>
                  <p className="text-sm text-gray-500">Verify with SMS code</p>
                </div>
                {completedMethods.includes('phone') && (
                  <Check className="w-6 h-6 text-green-500" />
                )}
              </button>

              {/* ID Verification */}
              <button
                onClick={() => setStep('id')}
                className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-orange-500 transition-all flex items-center gap-4 group"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                  <IdCard className="w-6 h-6 text-purple-600 group-hover:text-white" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-semibold text-gray-800">ID Verification</h3>
                  <p className="text-sm text-gray-500">Upload government ID</p>
                </div>
                {completedMethods.includes('id') && (
                  <Check className="w-6 h-6 text-green-500" />
                )}
              </button>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ Complete at least <strong>1 method</strong> to start using Ember
              </p>
            </div>
          </div>
        )}

        {/* Photo Verification Step */}
        {step === 'photo' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              onClick={() => setStep('intro')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Photo Verification</h2>
              <p className="text-gray-600">Upload a clear selfie showing your face</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            <button
              onClick={handlePhotoVerification}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Take/Upload Selfie'}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Phone Verification Step */}
        {step === 'phone' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              onClick={() => setStep('intro')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Phone Verification</h2>
              <p className="text-gray-600">We'll send you a verification code via SMS</p>
            </div>

            {!codeSent ? (
              <div className="space-y-4">
                <input
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendCode}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Enter the 6-digit code sent to {phoneNumber}
                </p>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest"
                />
                <button
                  onClick={handleVerifyCode}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
                <button
                  onClick={() => {
                    setCodeSent(false);
                    setVerificationCode('');
                  }}
                  className="w-full text-sm text-blue-600 hover:underline"
                >
                  Resend code
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* ID Verification Step */}
        {step === 'id' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <button
              onClick={() => setStep('intro')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IdCard className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">ID Verification</h2>
              <p className="text-gray-600">Upload a photo of your government-issued ID</p>
            </div>

            <input
              ref={idInputRef}
              type="file"
              accept="image/*"
              onChange={handleIDUpload}
              className="hidden"
            />

            <button
              onClick={() => idInputRef.current?.click()}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload ID Document'}
            </button>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
              <p className="font-semibold mb-2">Accepted documents:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Driver's License</li>
                <li>Passport</li>
                <li>National ID Card</li>
              </ul>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Success Step */}
        {step === 'success' && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Verification Complete!</h2>
              <p className="text-gray-600 mb-6">
                You've successfully verified your profile. Welcome to Ember!
              </p>

              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Completed: {completedMethods.map(m => m.charAt(0).toUpperCase() + m.slice(1)).join(', ')}
                </p>
              </div>

              <button
                onClick={handleContinue}
                className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Continue to Ember
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerificationWizard;
