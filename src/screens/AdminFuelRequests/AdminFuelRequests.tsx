import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Fuel, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import authService from '../../services/authService';
import { useToast } from '../../components/ui/toast';

interface FuelRequest {
  id: number;
  amount: number;
  stationName: string;
  stationNumber: string;
  attendantNumber: string;
  notes: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  riderName: string;
  riderPhone: string;
  riderStation?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
}

interface Stats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalAmount: number;
  monthlyAmount: number;
}

const AdminFuelRequests: React.FC = () => {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<FuelRequest[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalPending: 0,
    totalApproved: 0,
    totalRejected: 0,
    totalAmount: 0,
    monthlyAmount: 0
  });
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<FuelRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_ENDPOINTS.ADMIN}/fuel-requests`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` }
      });
      setRequests(response.data.requests || []);
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error('Failed to load requests:', error);
      // Populate with dummy data for demo
      const dummyRequests: FuelRequest[] = [
        {
          id: 1,
          amount: 150.00,
          stationName: 'Shell',
          stationNumber: '+233244567890',
          attendantNumber: '+233201234567',
          notes: 'Urgent delivery route',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
          riderName: 'Kwame Mensah',
          riderPhone: '+233245678901',
          riderStation: 'Accra Central',
        },
        {
          id: 2,
          amount: 200.00,
          stationName: 'Total',
          stationNumber: '+233244567891',
          attendantNumber: '+233201234568',
          notes: 'Long distance trip to Kumasi',
          status: 'PENDING',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          riderName: 'Ama Serwaa',
          riderPhone: '+233245678902',
          riderStation: 'Kumasi Station',
        },
        {
          id: 3,
          amount: 100.00,
          stationName: 'Goil',
          stationNumber: '+233244567892',
          attendantNumber: '+233201234569',
          notes: '',
          status: 'APPROVED',
          createdAt: new Date(Date.now() - 7200000).toISOString(),
          riderName: 'Kofi Asante',
          riderPhone: '+233245678903',
          riderStation: 'Tema Station',
          approvedBy: 'Admin User',
          approvedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 4,
          amount: 180.00,
          stationName: 'Puma',
          stationNumber: '+233244567893',
          attendantNumber: '+233201234570',
          notes: 'Multiple deliveries scheduled',
          status: 'APPROVED',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          riderName: 'Abena Osei',
          riderPhone: '+233245678904',
          riderStation: 'Accra Central',
          approvedBy: 'Manager',
          approvedAt: new Date(Date.now() - 82800000).toISOString(),
        },
        {
          id: 5,
          amount: 120.00,
          stationName: 'Allied',
          stationNumber: '+233244567894',
          attendantNumber: '+233201234571',
          notes: 'Insufficient documentation',
          status: 'REJECTED',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          riderName: 'Yaw Boateng',
          riderPhone: '+233245678905',
          riderStation: 'Takoradi Station',
          rejectionReason: 'Missing vehicle registration documents',
        },
        {
          id: 6,
          amount: 250.00,
          stationName: 'Star Oil',
          stationNumber: '+233244567895',
          attendantNumber: '+233201234572',
          notes: 'Emergency fuel request',
          status: 'PENDING',
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          riderName: 'Akua Frimpong',
          riderPhone: '+233245678906',
          riderStation: 'Kumasi Station',
        },
        {
          id: 7,
          amount: 90.00,
          stationName: 'Benab Oil',
          stationNumber: '+233244567896',
          attendantNumber: '+233201234573',
          notes: 'Regular refill',
          status: 'APPROVED',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          riderName: 'Kwesi Darko',
          riderPhone: '+233245678907',
          riderStation: 'Tema Station',
          approvedBy: 'Admin User',
          approvedAt: new Date(Date.now() - 255600000).toISOString(),
        },
      ];
      setRequests(dummyRequests);
      setStats({
        totalPending: 3,
        totalApproved: 3,
        totalRejected: 1,
        totalAmount: 1090.00,
        monthlyAmount: 850.00,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(true);

    try {
      await axios.post(
        `${API_ENDPOINTS.ADMIN}/fuel-requests/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
      showToast('Request approved successfully!', 'success');
      setShowDetailsModal(false);
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to approve request', 'error');
      setShowDetailsModal(false);
      setSelectedRequest(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      showToast('Please provide a rejection reason', 'warning');
      return;
    }

    setActionLoading(true);

    try {
      await axios.post(
        `${API_ENDPOINTS.ADMIN}/fuel-requests/${selectedRequest!.id}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );
      showToast('Request rejected successfully!', 'success');
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      loadRequests();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Failed to reject request', 'error');
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const filteredRequests = filter === 'ALL' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      APPROVED: 'bg-green-100 text-green-800 border-green-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300'
    };
    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      APPROVED: <CheckCircle className="w-4 h-4" />,
      REJECTED: <XCircle className="w-4 h-4" />
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    );
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="p-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Fuel Request Management</h1>
        <p className="text-gray-600">Review and approve rider fuel requests</p>
      </div>

      <div className="px-6 pb-4 flex-shrink-0">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.totalPending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.totalApproved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.totalRejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Total</p>
                <p className="text-2xl font-bold text-[#ea690c]">GHS {stats.monthlyAmount.toFixed(2)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-[#ea690c]" />
            </div>
          </CardContent>
        </Card>
      </div>
      </div>

      <div className="flex-1 overflow-hidden px-6 pb-6">
      <Card className="shadow-lg border-gray-200 h-full flex flex-col">
        <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-white">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-gray-800">
              <Fuel className="w-5 h-5 text-[#ea690c]" />
              Fuel Requests
            </CardTitle>
            <div className="flex gap-2">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className={filter === f ? 'bg-[#ea690c] hover:bg-[#d55a00]' : ''}
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No requests found</div>
          ) : (
            <div className="overflow-auto h-full">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rider</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Amount</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Station</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-gray-800">{req.riderName}</div>
                          <div className="text-sm text-gray-500">{req.riderPhone}</div>
                          {req.riderStation && (
                            <div className="text-xs text-gray-500 mt-1">{req.riderStation}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        GHS {req.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{req.stationName}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(req.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                      <td className="px-4 py-3">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(req);
                            setShowDetailsModal(true);
                          }}
                          className="bg-[#ea690c] hover:bg-[#d55a00] text-white"
                        >
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-800">Fuel Request Details</h3>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedRequest(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* Rider Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Fuel className="w-5 h-5 text-[#ea690c]" />
                  Rider Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>
                    <p className="font-medium text-gray-800">{selectedRequest.riderName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <p className="font-medium text-gray-800">{selectedRequest.riderPhone}</p>
                  </div>
                  {selectedRequest.riderStation && (
                    <div className="col-span-2">
                      <span className="text-gray-600">Station:</span>
                      <p className="font-medium text-gray-800">{selectedRequest.riderStation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fuel Request Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Request Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Amount:</span>
                    <p className="font-bold text-lg text-[#ea690c]">GHS {selectedRequest.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Fuel Station:</span>
                    <p className="font-medium text-gray-800">{selectedRequest.stationName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Station Number:</span>
                    <p className="font-medium text-gray-800">{selectedRequest.stationNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Attendant Number:</span>
                    <p className="font-medium text-gray-800">{selectedRequest.attendantNumber}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Request Date:</span>
                    <p className="font-medium text-gray-800">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Notes</h4>
                  <p className="text-sm text-gray-700">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Approval/Rejection Info */}
              {selectedRequest.status === 'APPROVED' && selectedRequest.approvedBy && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">Approval Information</h4>
                  <div className="text-sm space-y-1">
                    <p className="text-green-700">Approved by: <span className="font-medium">{selectedRequest.approvedBy}</span></p>
                    {selectedRequest.approvedAt && (
                      <p className="text-green-700">Approved at: <span className="font-medium">{new Date(selectedRequest.approvedAt).toLocaleString()}</span></p>
                    )}
                  </div>
                </div>
              )}

              {selectedRequest.status === 'REJECTED' && selectedRequest.rejectionReason && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2">Rejection Reason</h4>
                  <p className="text-sm text-red-700">{selectedRequest.rejectionReason}</p>
                </div>
              )}

              {/* Action Buttons */}
              {selectedRequest.status === 'PENDING' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {actionLoading ? 'Processing...' : 'Approve Request'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectModal(true);
                    }}
                    disabled={actionLoading}
                    className="flex-1 border-red-600 text-red-600 hover:bg-red-50 py-3"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Reject Request
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Reject Fuel Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting request from <span className="font-semibold">{selectedRequest?.riderName}</span> for GHS {selectedRequest?.amount.toFixed(2)}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Rejection *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                placeholder="Explain why this request is being rejected"
                rows={4}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={actionLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {actionLoading ? 'Processing...' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFuelRequests;
