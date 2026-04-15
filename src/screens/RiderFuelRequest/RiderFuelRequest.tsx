import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Fuel, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import axios from 'axios';
import { API_ENDPOINTS } from '../../config/api';
import authService from '../../services/authService';

interface FuelRequest {
  id: number;
  amount: number;
  stationName: string;
  stationNumber: string;
  attendantNumber: string;
  notes: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

const RiderFuelRequest: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [stationName, setStationName] = useState('');
  const [stationNumber, setStationNumber] = useState('');
  const [attendantNumber, setAttendantNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<FuelRequest[]>([]);

  const fuelStations = ['Shell', 'Total', 'Goil', 'Puma', 'Allied', 'Star Oil', 'Benab Oil', 'Zen Petroleum'];

  const loadRequests = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.RIDER}/fuel-requests`, {
        headers: { Authorization: `Bearer ${authService.getToken()}` }
      });
      setRequests(response.data);
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
        },
        {
          id: 2,
          amount: 200.00,
          stationName: 'Total',
          stationNumber: '+233244567891',
          attendantNumber: '+233201234568',
          notes: 'Long distance trip',
          status: 'APPROVED',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          approvedBy: 'Admin User',
          approvedAt: new Date(Date.now() - 1800000).toISOString(),
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
          approvedBy: 'Manager',
          approvedAt: new Date(Date.now() - 5400000).toISOString(),
        },
        {
          id: 4,
          amount: 120.00,
          stationName: 'Puma',
          stationNumber: '+233244567893',
          attendantNumber: '+233201234570',
          notes: 'Emergency refill',
          status: 'REJECTED',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 5,
          amount: 180.00,
          stationName: 'Allied',
          stationNumber: '+233244567894',
          attendantNumber: '+233201234571',
          notes: 'Multiple deliveries',
          status: 'PENDING',
          createdAt: new Date(Date.now() - 10800000).toISOString(),
        },
      ];
      setRequests(dummyRequests);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        `${API_ENDPOINTS.RIDER}/fuel-requests`,
        {
          amount: parseFloat(amount),
          stationName,
          stationNumber,
          attendantNumber,
          notes
        },
        { headers: { Authorization: `Bearer ${authService.getToken()}` } }
      );

      alert('Fuel request submitted successfully!');
      setAmount('');
      setStationName('');
      setStationNumber('');
      setAttendantNumber('');
      setNotes('');
      loadRequests();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      APPROVED: 'bg-green-100 text-green-800 border-green-300',
      REJECTED: 'bg-red-100 text-red-800 border-red-300'
    };
    const icons = {
      PENDING: <Clock className="w-3 h-3" />,
      APPROVED: <CheckCircle className="w-3 h-3" />,
      REJECTED: <XCircle className="w-3 h-3" />
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${styles[status as keyof typeof styles]}`}>
        {icons[status as keyof typeof icons]}
        {status}
      </span>
    );
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Fuel Request</h1>
        <p className="text-gray-600">Submit fuel requests for approval</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-white">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <Fuel className="w-5 h-5 text-[#ea690c]" />
                New Fuel Request
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Amount (GHS) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                    placeholder="Enter amount"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Station *
                  </label>
                  <select
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                    required
                  >
                    <option value="">Select fuel station</option>
                    {fuelStations.map((station) => (
                      <option key={station} value={station}>{station}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Station Number *
                  </label>
                  <input
                    type="text"
                    value={stationNumber}
                    onChange={(e) => setStationNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                    placeholder="e.g., +233XXXXXXXXX"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attendant Number *
                  </label>
                  <input
                    type="text"
                    value={attendantNumber}
                    onChange={(e) => setAttendantNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                    placeholder="e.g., +233XXXXXXXXX"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ea690c] focus:border-transparent"
                    placeholder="Additional information"
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#ea690c] hover:bg-[#d55a00] text-white"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-white">
              <CardTitle className="flex items-center justify-between text-gray-800">
                <span className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#ea690c]" />
                  Recent Requests
                </span>
                {pendingCount > 0 && (
                  <span className="bg-[#ea690c] text-white text-xs px-2 py-1 rounded-full">
                    {pendingCount} Pending
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {requests.slice(0, 5).map((req) => (
                  <div key={req.id} className="p-3 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-gray-800">GHS {req.amount.toFixed(2)}</span>
                      {getStatusBadge(req.status)}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-1">
                        <Fuel className="w-3 h-3" />
                        {req.stationName}
                      </div>
                      <div className="text-xs text-gray-600">
                        Station: {req.stationNumber}
                      </div>
                      <div className="text-xs text-gray-600">
                        Attendant: {req.attendantNumber}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                {requests.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No requests yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RiderFuelRequest;
