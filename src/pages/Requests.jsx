import { useState, useEffect, useMemo } from "react";
import DataTable from "react-data-table-component";
import { Pencil, Trash2, Check, X, Eye, RefreshCw, Search, AlertCircle, Plus, User, Car, MapPin, Calendar, DollarSign, Fuel, Phone, FileText, Copy, ExternalLink, CreditCard, Clock, TrendingUp } from "lucide-react"; 
import api from "../api";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [stations, setStations] = useState([]);
  const [cars, setCars] = useState([]);
  const [agents, setAgents] = useState([]);
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]); // NEW: To get user profiles for credit info
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [creditDetails, setCreditDetails] = useState(null); // NEW: Credit transaction details
  const [billingCycle, setBillingCycle] = useState(null); // NEW: Billing cycle info
  const [formData, setFormData] = useState({
    phone: "",
    user_uuid: "",
    fuel: "",
    fuel_type: "",
    amount: "",
    station_uuid: "",
    car_uuid: "",
    agent_uuid: "",
    status: "Pending",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });
  const [isApproving, setIsApproving] = useState(false); // NEW: Track approval status

  // Show notification
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 3000);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchRequests(),
        fetchStations(),
        fetchCars(),
        fetchAgents(),
        fetchUsers(),
        fetchProfiles() // NEW: Fetch profiles for credit info
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      showNotification("error", "Failed to load data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/requests");
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
      showNotification("error", "Failed to load requests");
      setRequests([]);
    }
  };

  const fetchStations = async () => {
    try {
      const { data } = await api.get("/stations");
      setStations(data || []);
    } catch (error) {
      console.error("Error fetching stations:", error);
      setStations([]);
    }
  };

  const fetchCars = async () => {
    try {
      const { data } = await api.get("/cars");
      setCars(data || []);
    } catch (error) {
      console.error("Error fetching cars:", error);
      setCars([]);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data } = await api.get("/agents");
      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
      setAgents([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/users");
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  // NEW: Fetch user profiles for credit information
  const fetchProfiles = async () => {
    try {
      const { data } = await api.get("/profiles");
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      setProfiles([]);
    }
  };

  // NEW: Check user's credit availability before approving
  const checkCreditAvailability = async (user_uuid, amount) => {
    try {
      const { data: profile } = await api.get(`/profiles/user/${user_uuid}`);
      if (!profile) {
        return { available: false, message: "User profile not found" };
      }

      const availableCredit = profile.available_credit || 0;
      const creditLimit = profile.credit_limit || 0;
      const overdraftAvailable = profile.overdraft_limit - profile.overdraft_used || 0;
      
      if (amount <= availableCredit) {
        return { 
          available: true, 
          message: "Sufficient credit available",
          availableCredit,
          creditLimit,
          isOverdraft: false
        };
      } else if (profile.overdraft_enabled && amount <= (availableCredit + overdraftAvailable)) {
        const overdraftAmount = amount - availableCredit;
        return { 
          available: true, 
          message: "Available with overdraft",
          availableCredit,
          creditLimit,
          overdraftAmount,
          isOverdraft: true
        };
      } else {
        return { 
          available: false, 
          message: `Insufficient credit. Available: $${availableCredit}, Overdraft available: $${overdraftAvailable}`,
          availableCredit,
          creditLimit
        };
      }
    } catch (error) {
      console.error("Error checking credit:", error);
      return { available: false, message: "Error checking credit availability" };
    }
  };

  // UPDATED: Handle View Function with credit transaction data
  const handleView = async (request) => {
    try {
      setIsLoading(true);
      
      // Fetch detailed request information
      const { data: requestData } = await api.get(`/requests/${request.request_uuid}`);
      
      // Fetch additional related data
      const [carData, stationData, agentData, userData, profileData] = await Promise.all([
        api.get(`/cars/${requestData.car_uuid}`).catch(() => ({ data: null })),
        api.get(`/stations/${requestData.station_uuid}`).catch(() => ({ data: null })),
        api.get(`/agents/${requestData.agent_uuid}`).catch(() => ({ data: null })),
        api.get(`/users/${requestData.user_uuid}`).catch(() => ({ data: null })),
        api.get(`/profiles/user/${requestData.user_uuid}`).catch(() => ({ data: null }))
      ]);

      // NEW: Fetch credit transaction details if request is approved
      let creditTransactionData = null;
      let billingCycleData = null;
      if (requestData.status === 'Approved' && requestData.credit_transaction_uuid) {
        try {
          // Try to get credit transaction
          const creditResponse = await api.get(`/credit-transactions/${requestData.credit_transaction_uuid}`);
          creditTransactionData = creditResponse.data;
          
          // Try to get billing cycle
          if (creditTransactionData?.billing_cycle_uuid) {
            const billingResponse = await api.get(`/billing-cycles/${creditTransactionData.billing_cycle_uuid}`);
            billingCycleData = billingResponse.data;
          }
        } catch (error) {
          console.log("Credit transaction data not found:", error.message);
        }
      }

      setRequestDetails({
        ...requestData,
        car: carData.data,
        station: stationData.data,
        agent: agentData.data,
        user: userData.data,
        profile: profileData.data,
        creditTransaction: creditTransactionData,
        billingCycle: billingCycleData
      });
      
      setIsViewOpen(true);
    } catch (error) {
      console.error("Error fetching request details:", error);
      showNotification("error", "Failed to load request details");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    let newErrors = {};
    
    const isAmountValid = formData.amount && !isNaN(formData.amount) && formData.amount > 0;
    const isFuelValid = formData.fuel && !isNaN(formData.fuel) && formData.fuel > 0;
    
    if (!isAmountValid && !isFuelValid) {
      newErrors.amount_fuel = "Either amount or fuel in litres is required";
    }

    if (!formData.fuel_type) newErrors.fuel_type = "Fuel type is required";
    if (!formData.station_uuid) newErrors.station_uuid = "Station is required";
    if (!formData.car_uuid) newErrors.car_uuid = "Car is required";
    if (!formData.agent_uuid) newErrors.agent_uuid = "Agent is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      let user_uuid = formData.user_uuid;
      
      if (!user_uuid && formData.phone) {
        try {
          const userData = await api.get(`/users/phone/${formData.phone}`);
          if (userData?.data?.user_uuid) {
            user_uuid = userData.data.user_uuid;
          } else {
            throw new Error("User not found");
          }
        } catch (error) {
          setErrors({ phone: "User not found with this phone number" });
          setIsLoading(false);
          return;
        }
      }

      const requestData = { 
        ...formData, 
        user_uuid,
        amount: formData.amount || null,
        fuel: formData.fuel || null
      };
      
      delete requestData.phone;

      if (isEdit) {
        await api.put(`/requests/${currentRequest.request_uuid}`, requestData);
        showNotification("success", "Request updated successfully");
      } else {
        await api.post("/requests", requestData);
        showNotification("success", "Request created successfully");
      }

      setIsModalOpen(false);
      fetchRequests();
      resetForm();
    } catch (error) {
      console.error("Error saving request:", error);
      const errorMsg = error.response?.data?.message || "Failed to save request";
      showNotification("error", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (request) => {
    setIsEdit(true);
    setCurrentRequest(request);
    setFormData({
      phone: "",
      fuel: request.fuel || "",
      fuel_type: request.fuel_type || "",
      amount: request.amount || "",
      station_uuid: request.station_uuid || "",
      car_uuid: request.car_uuid || "",
      agent_uuid: request.agent_uuid || "",
      status: request.status || "Pending",
      user_uuid: request.user_uuid || ""
    });
    setIsModalOpen(true);
  };

  // UPDATED: Handle Approve - Now creates credit transaction
  const handleApprove = async (request) => {
    if (!window.confirm("Are you sure you want to approve this request?")) return;
    
    setIsApproving(true);
    try {
      // First, check if user has sufficient credit
      const amount = parseFloat(request.amount);
      const creditCheck = await checkCreditAvailability(request.user_uuid, amount);
      
      if (!creditCheck.available) {
        showNotification("error", `Cannot approve: ${creditCheck.message}`);
        return;
      }

      // Get station info for fuel price
      const station = getStation(request.station_uuid);
      const fuelCostPerLiter = request.fuel_type === 'Petrol' ? station?.ppl_petrol : station?.ppl_diesel;
      const fuelAmountLiters = request.fuel;
      
      // Calculate amount if not provided
      const finalAmount = amount || (fuelAmountLiters * fuelCostPerLiter);
      
      // Create fuel purchase as credit transaction
      const fuelPurchaseData = {
        user_uuid: request.user_uuid,
        fuel_amount_liters: fuelAmountLiters,
        fuel_type: request.fuel_type,
        fuel_cost_per_liter: fuelCostPerLiter || 10, // Default to 10 if not available
        station_uuid: request.station_uuid,
        agent_uuid: formData.agent_uuid || request.agent_uuid,
        car_uuid: request.car_uuid,
        request_uuid: request.request_uuid
      };

      // Call the new credit transaction API
      const { data: transaction } = await api.post("/credit-transactions/fuel-purchase", fuelPurchaseData);
      
      // Update request status and link to credit transaction
      await api.put(`/requests/approve/${request.request_uuid}`, {
        agent_uuid: formData.agent_uuid || request.agent_uuid,
        credit_transaction_uuid: transaction.transaction_uuid,
        amount: finalAmount
      });

      showNotification("success", "Request approved and fuel purchase processed successfully");
      
      // Show credit information
      if (creditCheck.isOverdraft) {
        showNotification("warning", `Note: This purchase used $${creditCheck.overdraftAmount} of overdraft`);
      }
      
      fetchRequests();
      
    } catch (error) {
      console.error("Error approving request:", error);
      const errorMsg = error.response?.data?.message || "Failed to approve request";
      showNotification("error", errorMsg);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async (request_uuid) => {
    const reason = prompt("Please enter reason for rejection:");
    if (reason === null) return;
    
    setIsLoading(true);
    try {
      await api.put(`/requests/decline/${request_uuid}`, {
        agent_uuid: formData.agent_uuid || "",
        reason
      });
      
      showNotification("success", "Request rejected successfully");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
      showNotification("error", "Failed to reject request");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = (request_uuid) => {
    setRequestToDelete(request_uuid);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!requestToDelete) return;

    try {
      await api.delete(`/requests/${requestToDelete}`);
      showNotification("success", "Request deleted successfully");
      fetchRequests();
    } catch (error) {
      console.error("Error deleting request:", error);
      showNotification("error", "Failed to delete request");
    } finally {
      setShowDeleteConfirm(false);
      setRequestToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      phone: "",
      user_uuid: "",
      fuel: "",
      fuel_type: "",
      amount: "",
      station_uuid: "",
      car_uuid: "",
      agent_uuid: "",
      status: "Pending",
    });
    setErrors({});
    setIsEdit(false);
    setCurrentRequest(null);
  };

  // Helper function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showNotification("success", "Copied to clipboard");
  };

  // Get related data
  const getStation = (station_uuid) => stations.find(s => s.station_uuid === station_uuid);
  const getCar = (car_uuid) => cars.find(c => c.car_uuid === car_uuid);
  const getAgent = (agent_uuid) => agents.find(a => a.agent_uuid === agent_uuid);
  const getUser = (user_uuid) => users.find(u => u.user_uuid === user_uuid);
  const getProfile = (user_uuid) => profiles.find(p => p.user_uuid === user_uuid); // NEW

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return { date: "N/A", time: "", full: "N/A" };
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
      full: date.toLocaleString()
    };
  };

  // NEW: Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = 
        request.request_uuid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.fuel_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.status?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "Pending", label: "Pending" },
    { value: "Approved", label: "Approved" },
    { value: "Rejected", label: "Rejected" },
    { value: "Completed", label: "Completed" },
    { value: "Declined", label: "Declined" }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Declined': return 'bg-red-100 text-red-800';
      case 'Completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    {
      name: "Request ID",
      selector: (row) => row.request_uuid?.substring(0, 8) + "...",
      sortable: true,
      cell: (row) => (
        <div className="font-mono text-sm" title={row.request_uuid}>
          {row.request_uuid?.substring(0, 8)}...
          {row.credit_transaction_uuid && (
            <div className="text-xs text-green-600">✓ Linked</div>
          )}
        </div>
      ),
    },
    { 
      name: "Fuel Type", 
      selector: (row) => row.fuel_type, 
      sortable: true,
      cell: (row) => (
        <div className="font-medium">{row.fuel_type || "N/A"}</div>
      )
    },
    { 
      name: "Fuel(L)", 
      selector: (row) => row.fuel, 
      sortable: true,
      cell: (row) => (
        <div>{row.fuel ? `${row.fuel}L` : "N/A"}</div>
      )
    },
    { 
      name: "Amount", 
      selector: (row) => row.amount, 
      sortable: true,
      cell: (row) => (
        <div className="font-semibold">{formatCurrency(row.amount)}</div>
      )
    },
    { 
      name: "Station", 
      selector: (row) => row.station_uuid,
      cell: (row) => {
        const station = getStation(row.station_uuid);
        return <div>{station?.location || row.station_uuid?.substring(0, 8)}</div>;
      }
    },
    { 
      name: "Car", 
      selector: (row) => row.car_uuid,
      cell: (row) => {
        const car = getCar(row.car_uuid);
        return <div>{car?.car_model || row.car_uuid?.substring(0, 8)}</div>;
      }
    },
    { 
      name: "Agent", 
      selector: (row) => row.agent_uuid,
      cell: (row) => {
        const agent = getAgent(row.agent_uuid);
        return <div>{agent?.fullname || row.agent_uuid?.substring(0, 8)}</div>;
      }
    },
    {
      name: "Status",
      selector: (row) => row.status,
      sortable: true,
      cell: (row) => (
        <div className="flex items-center">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(row.status)}`}>
            {row.status}
          </span>
          {row.decline_reason && (
            <div className="ml-2 relative group">
              <AlertCircle size={14} className="text-red-500" />
              <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-48 z-10 -left-24 top-6">
                {row.decline_reason}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      name: "Date",
      selector: (row) => new Date(row.datetime).toLocaleDateString(),
      sortable: true,
      cell: (row) => {
        const date = formatDate(row.datetime);
        return (
          <div>
            <div className="text-sm">{date.date}</div>
            <div className="text-xs text-gray-500">{date.time}</div>
          </div>
        );
      },
    },
    {
      name: "Actions",
      cell: (row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleView(row)}
            className="p-1 text-gray-600 hover:text-blue-600 transition"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-gray-600 hover:text-blue-600 transition"
            title="Edit"
            disabled={row.status === 'Approved'}
          >
            <Pencil size={18} />
          </button>
          {row.status === 'Pending' && (
            <>
              <button
                onClick={() => handleApprove(row)}
                className="p-1 text-gray-600 hover:text-green-600 transition"
                title="Approve"
                disabled={isApproving}
              >
                <Check size={18} />
              </button>
              <button
                onClick={() => handleReject(row.request_uuid)}
                className="p-1 text-gray-600 hover:text-red-600 transition"
                title="Reject"
              >
                <X size={18} />
              </button>
            </>
          )}
          <button
            onClick={() => confirmDelete(row.request_uuid)}
            className="p-1 text-gray-600 hover:text-red-600 transition"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ),
      width: "180px"
    },
  ];

  // NEW: Render credit information section
  const renderCreditInformation = () => {
    if (!requestDetails?.creditTransaction) return null;

    const credit = requestDetails.creditTransaction;
    const profile = requestDetails.profile;
    const billingCycle = requestDetails.billingCycle;

    return (
      <div className="mt-8 border-t pt-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
          <CreditCard className="mr-2" size={20} />
          BNPL Credit Transaction
        </h3>
        
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Transaction Details */}
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Transaction Details</h4>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-gray-600">Transaction ID:</span>{' '}
                  <span className="font-mono font-medium">{credit.transaction_uuid?.substring(0, 8)}...</span>
                  <button
                    onClick={() => copyToClipboard(credit.transaction_uuid)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                    title="Copy ID"
                  >
                    <Copy size={12} />
                  </button>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Type:</span>{' '}
                  <span className="font-medium capitalize">{credit.type?.replace('_', ' ')}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Amount:</span>{' '}
                  <span className="font-medium">{formatCurrency(credit.principal_amount)}</span>
                </p>
                <p className="text-sm">
                  <span className="text-gray-600">Interest:</span>{' '}
                  <span className="font-medium">{formatCurrency(credit.interest_amount)}</span>
                </p>
                {credit.is_overdraft && (
                  <p className="text-sm">
                    <span className="text-gray-600">Overdraft:</span>{' '}
                    <span className="font-medium text-red-600">Yes (7% interest)</span>
                  </p>
                )}
                <p className="text-sm">
                  <span className="text-gray-600">Status:</span>{' '}
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    credit.status === 'completed' ? 'bg-green-100 text-green-800' :
                    credit.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {credit.status}
                  </span>
                </p>
              </div>
            </div>

            {/* User Credit Status */}
            <div>
              <h4 className="font-medium text-blue-800 mb-2">User Credit Status</h4>
              {profile ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-600">Credit Limit:</span>{' '}
                    <span className="font-medium">{formatCurrency(profile.credit_limit)}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Available Credit:</span>{' '}
                    <span className="font-medium">{formatCurrency(profile.available_credit)}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Credit Used:</span>{' '}
                    <span className="font-medium">{formatCurrency(profile.credit_utilized)}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Outstanding Balance:</span>{' '}
                    <span className="font-medium">{formatCurrency(profile.outstanding_balance)}</span>
                  </p>
                  {profile.overdraft_used > 0 && (
                    <p className="text-sm">
                      <span className="text-gray-600">Overdraft Used:</span>{' '}
                      <span className="font-medium text-red-600">{formatCurrency(profile.overdraft_used)}</span>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">Profile information not available</p>
              )}
            </div>

            {/* Billing Cycle Info */}
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Billing Cycle</h4>
              {billingCycle ? (
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-gray-600">Cycle Period:</span>{' '}
                    <span className="font-medium">{billingCycle.cycle_period}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Due Date:</span>{' '}
                    <span className="font-medium">{formatDate(billingCycle.due_date).date}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Status:</span>{' '}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      billingCycle.status === 'open' ? 'bg-blue-100 text-blue-800' :
                      billingCycle.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                      billingCycle.status === 'overdue' ? 'bg-red-100 text-red-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {billingCycle.status}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-gray-600">Cycle Type:</span>{' '}
                    <span className="font-medium capitalize">{billingCycle.cycle_type}</span>
                  </p>
                  <div className="mt-3 space-y-1">
                    <button
                      onClick={() => window.open(`/credit-transactions/${credit.transaction_uuid}`, '_blank')}
                      className="w-full flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-xs"
                    >
                      <ExternalLink size={12} className="mr-1" />
                      View Transaction
                    </button>
                    <button
                      onClick={() => copyToClipboard(credit.transaction_uuid)}
                      className="w-full flex items-center justify-center px-3 py-1.5 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition text-xs"
                    >
                      <Copy size={12} className="mr-1" />
                      Copy Transaction ID
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500">Billing cycle not available</p>
                  <button
                    onClick={() => {
                      // Create billing cycle if needed
                      api.post('/billing-cycles/get-or-create', { user_uuid: requestDetails.user_uuid })
                        .then(() => {
                          showNotification('success', 'Billing cycle created');
                          handleView(requestDetails);
                        })
                        .catch(error => {
                          showNotification('error', 'Failed to create billing cycle');
                        });
                    }}
                    className="mt-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-xs"
                  >
                    Create Billing Cycle
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Interest Calculation Info */}
          {credit.interest_amount > 0 && (
            <div className="mt-4 pt-4 border-t border-blue-200">
              <h5 className="font-medium text-blue-800 mb-2 flex items-center">
                <TrendingUp size={16} className="mr-1" />
                Interest Calculation
              </h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Principal</p>
                  <p className="font-medium">{formatCurrency(credit.principal_amount)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Interest Rate</p>
                  <p className="font-medium">{credit.is_overdraft ? '7%' : '5%'} monthly</p>
                </div>
                <div>
                  <p className="text-gray-600">Grace Period</p>
                  <p className="font-medium">{profile?.grace_period_days || 14} days</p>
                </div>
                <div>
                  <p className="text-gray-600">Total</p>
                  <p className="font-medium">{formatCurrency(credit.total_amount)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fuel Requests</h1>
          <p className="text-gray-600">Manage fuel requests with BNPL credit system</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <CreditCard size={14} className="inline mr-1" />
            BNPL Enabled
          </div>
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus size={20} className="mr-2" />
            Add Request
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="text-2xl font-bold text-blue-600">{requests.length}</div>
          <div className="text-sm text-gray-600">Total Requests</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
          <div className="text-2xl font-bold text-yellow-600">
            {requests.filter(r => r.status === 'Pending').length}
          </div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <div className="text-2xl font-bold text-green-600">
            {requests.filter(r => r.status === 'Approved').length}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
          <div className="text-2xl font-bold text-red-600">
            {requests.filter(r => r.status === 'Declined' || r.status === 'Rejected').length}
          </div>
          <div className="text-sm text-gray-600">Declined/Rejected</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchAllData}
            disabled={isRefreshing}
            className="flex items-center px-3 py-2 border rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw size={18} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="text-sm text-gray-500">
            {filteredRequests.length} of {requests.length} requests
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto border rounded-lg">
        <DataTable
          columns={columns}
          data={filteredRequests}
          pagination
          highlightOnHover
          responsive
          progressPending={isRefreshing}
          progressComponent={
            <div className="p-8 text-center">
              <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
              <p>Loading requests...</p>
            </div>
          }
          noDataComponent={
            <div className="p-8 text-center text-gray-500">
              <p>No requests found</p>
              <p className="text-sm mt-2">Try changing your filters or add a new request</p>
            </div>
          }
        />
      </div>

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 animate-slide-in ${
          notification.type === 'error' ? 'bg-red-100 text-red-800 border-red-200' :
          notification.type === 'success' ? 'bg-green-100 text-green-800 border-green-200' :
          'bg-blue-100 text-blue-800 border-blue-200'
        }`}>
          <div className="flex items-center">
            {notification.type === 'error' && <AlertCircle className="mr-2" size={20} />}
            {notification.type === 'success' && <Check className="mr-2" size={20} />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <div className="flex items-center mb-4">
              <AlertCircle className="text-red-500 mr-3" size={24} />
              <h3 className="text-lg font-bold">Confirm Delete</h3>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this request? This action cannot be undone.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Delete Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Request Details Modal */}
      {isViewOpen && requestDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Request Details</h2>
                <p className="text-sm text-gray-600">Request ID: {requestDetails.request_uuid}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => copyToClipboard(requestDetails.request_uuid)}
                  className="p-2 text-gray-500 hover:text-blue-600 transition"
                  title="Copy Request ID"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 transition"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Status Banner */}
              <div className={`mb-6 p-4 rounded-lg ${getStatusColor(requestDetails.status).replace('text-', 'border-')} border-l-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(requestDetails.status)}`}>
                      {requestDetails.status}
                    </span>
                    {requestDetails.decline_reason && (
                      <p className="ml-4 text-gray-700">{requestDetails.decline_reason}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatDate(requestDetails.datetime).full}
                  </div>
                </div>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Column 1: Request Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <FileText className="mr-2" size={20} />
                    Request Information
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Fuel className="text-blue-600 mr-2" size={18} />
                        <h4 className="font-medium">Fuel Details</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Fuel Type</p>
                          <p className="font-medium">{requestDetails.fuel_type || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Quantity</p>
                          <p className="font-medium">{requestDetails.fuel ? `${requestDetails.fuel} Litres` : "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Amount</p>
                          <p className="font-medium">{formatCurrency(requestDetails.amount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Date Requested</p>
                          <p className="font-medium">{formatDate(requestDetails.datetime).date}</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <MapPin className="text-green-600 mr-2" size={18} />
                        <h4 className="font-medium">Station Details</h4>
                      </div>
                      {requestDetails.station ? (
                        <div>
                          <p className="font-medium">{requestDetails.station.name || requestDetails.station.location}</p>
                          <p className="text-sm text-gray-600">{requestDetails.station.location}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Prices: Petrol ${requestDetails.station.ppl_petrol}/L, Diesel ${requestDetails.station.ppl_diesel}/L
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">Station information not available</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Column 2: User & Vehicle */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 flex items-center">
                    <User className="mr-2" size={20} />
                    User & Vehicle
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <User className="text-purple-600 mr-2" size={18} />
                        <h4 className="font-medium">User Information</h4>
                      </div>
                      {requestDetails.user ? (
                        <div>
                          <p className="font-medium">{requestDetails.user.fullname || "N/A"}</p>
                          <p className="text-sm text-gray-600">
                            <Phone size={14} className="inline mr-1" />
                            {requestDetails.user.phone || "No phone"}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            User ID: {requestDetails.user_uuid?.substring(0, 8)}...
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">User information not available</p>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <Car className="text-orange-600 mr-2" size={18} />
                        <h4 className="font-medium">Vehicle Details</h4>
                      </div>
                      {requestDetails.car ? (
                        <div>
                          <p className="font-medium">{requestDetails.car.car_model}</p>
                          <p className="text-sm text-gray-600">Plate: {requestDetails.car.car_number}</p>
                          <p className="text-sm text-gray-600">
                            Fuel Type: {requestDetails.car.fuel_type || "N/A"}
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">Vehicle information not available</p>
                      )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center mb-2">
                        <User className="text-teal-600 mr-2" size={18} />
                        <h4 className="font-medium">Agent Information</h4>
                      </div>
                      {requestDetails.agent ? (
                        <div>
                          <p className="font-medium">{requestDetails.agent.fullname}</p>
                          <p className="text-sm text-gray-600">
                            Agent ID: {requestDetails.agent_uuid?.substring(0, 8)}...
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-500">Agent information not available</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Credit Information Section */}
              {renderCreditInformation()}

              {/* Action Buttons */}
              <div className="mt-8 pt-6 border-t flex justify-end space-x-3">
                <button
                  onClick={() => handleEdit(requestDetails)}
                  disabled={requestDetails.status === 'Approved'}
                  className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Pencil size={16} className="inline mr-2" />
                  Edit Request
                </button>
                <button
                  onClick={() => setIsViewOpen(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-40 p-4">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{isEdit ? "Edit Request" : "Add New Request"}</h2>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="text-red-500 mr-2" size={20} />
                  <span className="text-red-700">{errors.general}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1 */}
                <div>
                  <div className="mb-4">
                    <label className="block mb-2 font-medium">Phone Number *</label>
                    <input
                      type="tel"
                      className={`w-full border p-3 rounded-lg ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+1234567890"
                      disabled={isEdit}
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2 font-medium">Fuel Type *</label>
                    <select
                      className={`w-full border p-3 rounded-lg ${errors.fuel_type ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.fuel_type}
                      onChange={(e) => setFormData({ ...formData, fuel_type: e.target.value })}
                    >
                      <option value="">Select Fuel Type</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                    </select>
                    {errors.fuel_type && <p className="text-red-500 text-sm mt-1">{errors.fuel_type}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block mb-2 font-medium">Amount ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        className={`w-full border p-3 rounded-lg ${errors.amount_fuel ? 'border-red-500' : 'border-gray-300'}`}
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block mb-2 font-medium">Fuel (L)</label>
                      <input
                        type="number"
                        step="0.1"
                        className={`w-full border p-3 rounded-lg ${errors.amount_fuel ? 'border-red-500' : 'border-gray-300'}`}
                        value={formData.fuel}
                        onChange={(e) => setFormData({ ...formData, fuel: e.target.value })}
                        placeholder="0.0"
                      />
                    </div>
                  </div>
                  {errors.amount_fuel && (
                    <p className="text-red-500 text-sm mb-4">{errors.amount_fuel}</p>
                  )}
                </div>

                {/* Column 2 */}
                <div>
                  <div className="mb-4">
                    <label className="block mb-2 font-medium">Station *</label>
                    <select
                      className={`w-full border p-3 rounded-lg ${errors.station_uuid ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.station_uuid}
                      onChange={(e) => setFormData({ ...formData, station_uuid: e.target.value })}
                    >
                      <option value="">Select Station</option>
                      {stations.map((station) => (
                        <option key={station.station_uuid} value={station.station_uuid}>
                          {station.name || station.location}
                        </option>
                      ))}
                    </select>
                    {errors.station_uuid && <p className="text-red-500 text-sm mt-1">{errors.station_uuid}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2 font-medium">Car *</label>
                    <select
                      className={`w-full border p-3 rounded-lg ${errors.car_uuid ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.car_uuid}
                      onChange={(e) => setFormData({ ...formData, car_uuid: e.target.value })}
                    >
                      <option value="">Select Car</option>
                      {cars.map((car) => (
                        <option key={car.car_uuid} value={car.car_uuid}>
                          {car.car_model} ({car.car_number})
                        </option>
                      ))}
                    </select>
                    {errors.car_uuid && <p className="text-red-500 text-sm mt-1">{errors.car_uuid}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2 font-medium">Agent *</label>
                    <select
                      className={`w-full border p-3 rounded-lg ${errors.agent_uuid ? 'border-red-500' : 'border-gray-300'}`}
                      value={formData.agent_uuid}
                      onChange={(e) => setFormData({ ...formData, agent_uuid: e.target.value })}
                    >
                      <option value="">Select Agent</option>
                      {agents.map((agent) => (
                        <option key={agent.agent_uuid} value={agent.agent_uuid}>
                          {agent.fullname}
                        </option>
                      ))}
                    </select>
                    {errors.agent_uuid && <p className="text-red-500 text-sm mt-1">{errors.agent_uuid}</p>}
                  </div>

                  <div className="mb-4">
                    <label className="block mb-2 font-medium">Status</label>
                    <select
                      className="w-full border p-3 rounded-lg border-gray-300"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Declined">Declined</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <RefreshCw className="animate-spin mr-2" size={18} />
                      Saving...
                    </div>
                  ) : isEdit ? "Update Request" : "Create Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}