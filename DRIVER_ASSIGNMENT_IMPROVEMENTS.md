# Driver Assignment Improvements - Parcel Transfer

## ✅ Changes Made

### 1. **Optional Driver Details During Transfer**
- Driver name, phone, and vehicle number are now optional fields
- Removed validation requirements for driver fields in step 1
- Added helpful info message explaining drivers can be assigned later
- Updated UI to show "(Optional)" placeholder text

### 2. **Visual Indicators**
- Added blue info box explaining optional driver assignment
- Review step shows warning when no driver is assigned
- Label printing handles missing driver information gracefully

### 3. **Label Printing Updates**
- Labels show "To be assigned" when driver info is missing
- Conditional rendering of driver/vehicle sections
- Professional appearance maintained even without driver details

## 🎯 Next Steps: Bulk Driver Assignment

### Feature Overview
Add ability to assign drivers to multiple parcels at once from the Outgoing Parcels page.

### Implementation Plan

#### 1. **Add Bulk Assignment Button**
```tsx
// In OutgoingParcels.tsx - Add to the parcels without drivers section
<Button
  onClick={() => setShowBulkAssignment(true)}
  className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
>
  <UserIcon className="h-4 w-4 mr-2" />
  Assign Driver to Selected
</Button>
```

#### 2. **Create Bulk Assignment Modal**
```tsx
interface BulkDriverAssignmentProps {
  selectedParcels: Parcel[];
  onAssign: (driverInfo: DriverInfo) => Promise<void>;
  onClose: () => void;
}

const BulkDriverAssignment: React.FC<BulkDriverAssignmentProps> = ({
  selectedParcels,
  onAssign,
  onClose
}) => {
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!driverName || !vehicleNumber) {
      showToast("Driver name and vehicle number are required", "error");
      return;
    }

    setIsAssigning(true);
    try {
      await onAssign({
        driverName,
        driverPhoneNumber: driverPhone,
        vehicleNumber
      });
      showToast(`Driver assigned to ${selectedParcels.length} parcels`, "success");
      onClose();
    } catch (error) {
      showToast("Failed to assign driver", "error");
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border border-[#d1d1d1] bg-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-neutral-800">
                Assign Driver to Parcels
              </h3>
              <p className="text-sm text-[#5d5d5d] mt-1">
                Assigning driver to {selectedParcels.length} selected parcel(s)
              </p>
            </div>
            <button onClick={onClose} className="text-[#9a9a9a] hover:text-neutral-800">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selected Parcels Preview */}
          <div className="mb-6 max-h-40 overflow-y-auto border border-[#d1d1d1] rounded-lg p-3 bg-gray-50">
            <p className="text-xs font-semibold text-neutral-800 mb-2">
              Selected Parcels:
            </p>
            <div className="space-y-1">
              {selectedParcels.map(parcel => (
                <div key={parcel.parcelId} className="text-xs text-[#5d5d5d]">
                  • {parcel.parcelId} - {parcel.receiverName}
                </div>
              ))}
            </div>
          </div>

          {/* Driver Form */}
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block">
                Driver Name <span className="text-[#e22420]">*</span>
              </Label>
              <Input
                placeholder="John Smith"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="border-[#d1d1d1]"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block">
                Driver Phone
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium pointer-events-none z-10">
                  +233
                </span>
                <Input
                  type="tel"
                  placeholder="0XXXXXXXXX"
                  value={driverPhone?.startsWith("+233") ? driverPhone.substring(4) : (driverPhone || "")}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\\D/g, "").substring(0, 10);
                    const normalized = digits ? normalizePhoneNumber(digits) : "";
                    setDriverPhone(normalized);
                  }}
                  className="pl-14 pr-3 border-[#d1d1d1]"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block">
                Vehicle Number <span className="text-[#e22420]">*</span>
              </Label>
              <Input
                placeholder="AK-1234-25"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="border-[#d1d1d1]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-[#d1d1d1]">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-[#d1d1d1]"
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={isAssigning || !driverName || !vehicleNumber}
              className="flex-1 bg-[#ea690c] text-white hover:bg-[#ea690c]/90 disabled:opacity-50"
            >
              {isAssigning ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserIcon className="h-4 w-4 mr-2" />
                  Assign Driver
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
```

#### 3. **Add Bulk Assignment Logic**
```tsx
const handleBulkDriverAssignment = async (driverInfo: DriverInfo) => {
  const token = authService.getToken();
  if (!token) {
    showToast("Authentication token not found", "error");
    return;
  }

  const selectedParcelsList = parcels.filter(p => selectedParcels.has(p.parcelId));
  
  try {
    // Update each parcel with driver information
    const promises = selectedParcelsList.map(parcel =>
      axios.put(
        `${API_ENDPOINTS.FRONTDESK}/parcel/${parcel.parcelId}`,
        {
          driverName: driverInfo.driverName,
          driverPhoneNumber: driverInfo.driverPhoneNumber,
          vehicleNumber: driverInfo.vehicleNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
    );

    await Promise.all(promises);
    
    // Update local state
    setParcels(prev => prev.map(p => 
      selectedParcels.has(p.parcelId)
        ? { ...p, ...driverInfo }
        : p
    ));
    
    // Clear selection
    setSelectedParcels(new Set());
    
    showToast(`Driver assigned to ${selectedParcelsList.length} parcels successfully`, "success");
  } catch (error: any) {
    console.error("Error assigning driver:", error);
    showToast(
      error.response?.data?.message || "Failed to assign driver to parcels",
      "error"
    );
    throw error;
  }
};
```

#### 4. **Add "Unassigned Parcels" Section**
```tsx
// Group parcels by assignment status
const unassignedParcels = filteredParcels.filter(p => !p.driverName && !p.vehicleNumber);
const assignedParcels = filteredParcels.filter(p => p.driverName || p.vehicleNumber);

// Show unassigned parcels section first
{unassignedParcels.length > 0 && (
  <Card className="border-2 border-amber-300 bg-amber-50">
    <CardContent className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <h3 className="text-base font-bold text-neutral-800">
            Unassigned Parcels ({unassignedParcels.length})
          </h3>
        </div>
        {selectedParcels.size > 0 && (
          <Button
            onClick={() => setShowBulkAssignment(true)}
            className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90"
          >
            <UserIcon className="h-4 w-4 mr-2" />
            Assign Driver to Selected ({selectedParcels.size})
          </Button>
        )}
      </div>
      
      {/* Unassigned parcels table */}
      <div className="overflow-x-auto rounded-lg border border-amber-300">
        <table className="w-full">
          {/* Table content */}
        </table>
      </div>
    </CardContent>
  </Card>
)}
```

## 📋 User Workflow

### Scenario 1: Register Parcel Without Driver
1. User goes to Parcel Transfer
2. Fills in sender, receiver, and cost details
3. Leaves driver fields empty
4. Submits parcel
5. Label prints with "To be assigned" for driver info

### Scenario 2: Assign Driver Later (Single)
1. User goes to Outgoing Parcels
2. Finds parcel without driver
3. Clicks "Edit" button
4. Fills in driver details
5. Saves changes

### Scenario 3: Bulk Driver Assignment
1. User goes to Outgoing Parcels
2. Sees "Unassigned Parcels" section at top
3. Selects multiple parcels using checkboxes
4. Clicks "Assign Driver to Selected" button
5. Fills in driver information in modal
6. Confirms assignment
7. All selected parcels updated with driver info

## 🎨 UI Improvements

### Visual Hierarchy
- Unassigned parcels shown in amber-highlighted section at top
- Clear visual distinction between assigned and unassigned
- Selection checkboxes for bulk operations
- Action buttons contextually appear when parcels selected

### User Feedback
- Toast notifications for successful assignments
- Loading states during bulk operations
- Clear count of selected parcels
- Preview of selected parcels in assignment modal

## 🔧 Technical Considerations

### API Calls
- Batch update using Promise.all for efficiency
- Individual error handling for each parcel
- Rollback strategy if some updates fail

### State Management
- Local state updates after successful API calls
- Selection state cleared after assignment
- Optimistic UI updates for better UX

### Validation
- Driver name required for assignment
- Vehicle number required for assignment
- Phone number optional but validated if provided

## ✅ Benefits

1. **Flexibility**: Register parcels immediately even without driver
2. **Efficiency**: Bulk assign drivers to multiple parcels at once
3. **Workflow**: Matches real-world operations where drivers assigned later
4. **User Experience**: Clear visual indicators and easy-to-use interface
5. **Data Integrity**: Validation ensures quality when driver info provided

## 🚀 Future Enhancements

1. **Driver Pool**: Dropdown of available drivers from database
2. **Smart Assignment**: Suggest drivers based on route/availability
3. **Driver History**: Show past assignments for each driver
4. **Capacity Planning**: Track how many parcels per driver
5. **Route Optimization**: Group parcels by destination for driver assignment

---

**Driver assignment is now flexible and efficient! 🎉**
