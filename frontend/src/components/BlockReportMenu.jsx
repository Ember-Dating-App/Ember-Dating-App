import React, { useState } from 'react';
import axios from 'axios';
import { Ban, Flag, X } from 'lucide-react';

const API_BASE = process.env.REACT_APP_BACKEND_URL || '';

const BlockReportMenu = ({ userId, userName, onBlock, onReport }) => {
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBlock = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('ember_token');
      await axios.post(
        `${API_BASE}/api/users/block`,
        { blocked_user_id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onBlock?.();
      setShowBlockConfirm(false);
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Failed to block user');
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async () => {
    if (!reportReason) {
      alert('Please select a reason');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('ember_token');
      await axios.post(
        `${API_BASE}/api/users/report`,
        { 
          reported_user_id: userId,
          reason: reportReason,
          details: reportDetails
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onReport?.();
      setShowReportModal(false);
      alert('Report submitted successfully');
    } catch (error) {
      console.error('Error reporting user:', error);
      alert('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-2">
        <button
          onClick={() => setShowBlockConfirm(true)}
          className="w-full px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Ban className="w-5 h-5" />
          <span className="font-medium">Block User</span>
        </button>

        <button
          onClick={() => setShowReportModal(true)}
          className="w-full px-4 py-3 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Flag className="w-5 h-5" />
          <span className="font-medium">Report User</span>
        </button>
      </div>

      {/* Block Confirmation Modal */}
      {showBlockConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Block {userName}?</h3>
            <p className="text-gray-600 mb-6">
              They won't be able to find you on Ember or send you messages. This action will also unmatch you.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleBlock}
                disabled={loading}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Blocking...' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-gray-800 mb-4">Report {userName}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select a reason</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="harassment">Harassment</option>
                  <option value="fake">Fake Profile</option>
                  <option value="scam">Scam or Fraud</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide more information..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                onClick={handleReport}
                disabled={loading}
                className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlockReportMenu;