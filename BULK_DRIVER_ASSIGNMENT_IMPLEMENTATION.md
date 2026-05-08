# Implementation Guide: Bulk Driver Assignment Feature

## 📋 Overview
This guide provides step-by-step instructions to add bulk driver assignment functionality to the Outgoing Parcels page, allowing users to assign drivers to multiple parcels at once.

## 🎯 Feature Requirements

### Functional Requirements
1. Display unassigned parcels in a separate highlighted section
2. Allow selection of multiple parcels via checkboxes
3. Provide bulk assignment modal with driver form
4. Update multiple parcels with driver information
5. Show success/error feedback
6. Refresh parcel list after assignment

### Non-Functional Requirements
1. Fast bulk updates (parallel API calls)
2. Clear visual feedback during operations
3. Graceful error handling
4. Responsive design
5. Accessible UI components

## 🔧 Implementation Steps

### Step 1: Add State Management

Add these state variables to `OutgoingParcels.tsx`:

```tsx
// Add after existing state declarations
const [showBulkAssignment, setShowBulkAssignment] = useState(false);
const [selectedForAssignment, setSelectedForAssignment] = useState<Set<string>>(new Set());
```

### Step 2: Create Driver Info Interface

Add this interface at the top of the file:

```tsx
interface DriverInfo {
  driverName: string;
  driverPhoneNumber: string;
  vehicleNumber: string;
}
```

### Step 3: Add Bulk Assignment Handler

Add this function before the return statement:

```tsx
const handleBulkDriverAssignment = async (driverInfo: DriverInfo) => {
  const token = authService.getToken();
  if (!token) {
    showToast("Authentication token not found", "error");
    throw new Error("No token");
  }

  const selectedParcelsList = parcels.filter(p => 
    selectedForAssignment.has(p.parcelId) && !p.driverName && !p.vehicleNumber
  );
  
  if (selectedParcelsList.length === 0) {
    showToast("No unassigned parcels selected", "warning");
    return;
  }

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
      selectedForAssignment.has(p.parcelId)
        ? { ...p, ...driverInfo }
        : p
    ));
    
    // Clear selection
    setSelectedForAssignment(new Set());
    
    showToast(
      `Driver assigned to ${selectedParcelsList.length} parcel(s) successfully`, 
      "success"
    );
  } catch (error: any) {
    console.error("Error assigning driver:", error);
    showToast(
      error.response?.data?.message || "Failed to assign driver to some parcels",
      "error"
    );
    throw error;
  }
};
```

### Step 4: Add Selection Handlers

Add these helper functions:

```tsx
const toggleParcelForAssignment = (parcelId: string) => {
  const newSelected = new Set(selectedForAssignment);
  if (newSelected.has(parcelId)) {
    newSelected.delete(parcelId);
  } else {
    newSelected.add(parcelId);
  }
  setSelectedForAssignment(newSelected);
};

const toggleAllUnassignedParcels = (unassignedParcels: Parcel[]) => {
  const unassignedIds = unassignedParcels.map(p => p.parcelId);
  const allSelected = unassignedIds.every(id => selectedForAssignment.has(id));
  
  const newSelected = new Set(selectedForAssignment);
  if (allSelected) {
    unassignedIds.forEach(id => newSelected.delete(id));
  } else {
    unassignedIds.forEach(id => newSelected.add(id));
  }
  setSelectedForAssignment(newSelected);
};
```

### Step 5: Create Bulk Assignment Modal Component

Add this component before the main component's return statement:

```tsx
interface BulkDriverAssignmentModalProps {
  selectedParcels: Parcel[];
  onAssign: (driverInfo: DriverInfo) => Promise<void>;
  onClose: () => void;
}

const BulkDriverAssignmentModal: React.FC<BulkDriverAssignmentModalProps> = ({
  selectedParcels,
  onAssign,
  onClose
}) => {
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!driverName.trim()) {
      showToast("Driver name is required", "error");
      return;
    }
    if (!vehicleNumber.trim()) {
      showToast("Vehicle number is required", "error");
      return;
    }

    setIsAssigning(true);
    try {
      await onAssign({
        driverName: driverName.trim(),
        driverPhoneNumber: driverPhone.trim(),
        vehicleNumber: vehicleNumber.trim(),
      });
      onClose();
    } catch (error) {
      // Error already handled in onAssign
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl border border-[#d1d1d1] bg-white shadow-lg max-h-[90vh] overflow-y-auto">
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
            <button 
              onClick={onClose} 
              className="text-[#9a9a9a] hover:text-neutral-800"
              disabled={isAssigning}
            >
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
                <div key={parcel.parcelId} className="text-xs text-[#5d5d5d] flex items-center justify-between">
                  <span>• {parcel.parcelId} - {parcel.receiverName}</span>
                  <span className="text-[10px] text-[#9a9a9a]">{parcel.to?.officeName}</span>
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
                disabled={isAssigning}
                autoFocus
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
                  disabled={isAssigning}
                />
              </div>
              <p className="text-[11px] text-[#5d5d5d] mt-1">Optional - Format: +233XXXXXXXXX or 0XXXXXXXXX</p>
            </div>

            <div>
              <Label className="text-xs font-semibold text-neutral-800 mb-1.5 block">
                Vehicle Number <span className="text-[#e22420]">*</span>
              </Label>
              <Input
                placeholder="AK-1234-25"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                className="border-[#d1d1d1]"
                disabled={isAssigning}
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
              disabled={isAssigning || !driverName.trim() || !vehicleNumber.trim()}
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

### Step 6: Add Unassigned Parcels Section

Replace the existing parcels list section with this enhanced version:

```tsx
// After the Stats section and before the existing parcels list
{/* Separate unassigned and assigned parcels */}
{(() => {
  const unassignedParcels = filteredParcels.filter(p => !p.driverName && !p.vehicleNumber);
  const assignedParcels = filteredParcels.filter(p => p.driverName || p.vehicleNumber);
  
  return (
    <>
      {/* Unassigned Parcels Section */}
      {unassignedParcels.length > 0 && (
        <Card className="border-2 border-amber-300 bg-amber-50/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-amber-100 p-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-800">
                    Unassigned Parcels
                  </h3>
                  <p className="text-xs text-[#5d5d5d]">
                    {unassignedParcels.length} parcel(s) waiting for driver assignment
                  </p>
                </div>
              </div>
              {selectedForAssignment.size > 0 && (
                <Button
                  onClick={() => setShowBulkAssignment(true)}
                  className="bg-[#ea690c] text-white hover:bg-[#ea690c]/90 flex items-center gap-2"
                >
                  <UserIcon className="h-4 w-4" />
                  Assign Driver to Selected ({selectedForAssignment.size})
                </Button>
              )}
            </div>

            {/* Bulk selection bar */}
            <div className="mb-3 flex items-center gap-3 bg-white rounded-lg border border-amber-300 p-3">
              <input
                type="checkbox"
                checked={unassignedParcels.length > 0 && unassignedParcels.every(p => selectedForAssignment.has(p.parcelId))}
                onChange={() => toggleAllUnassignedParcels(unassignedParcels)}
                className="h-4 w-4 rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
              />
              <span className="text-sm font-medium text-neutral-800">
                {selectedForAssignment.size > 0 
                  ? `${selectedForAssignment.size} parcel(s) selected` 
                  : 'Select all unassigned parcels'}
              </span>
            </div>
            
            {/* Unassigned parcels table */}
            <div className="overflow-x-auto rounded-lg border border-amber-300 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-amber-50 to-amber-100 border-b-2 border-amber-300">
                    <th className="px-4 py-3 text-center text-xs font-bold text-neutral-800 uppercase">
                      <input
                        type="checkbox"
                        checked={unassignedParcels.length > 0 && unassignedParcels.every(p => selectedForAssignment.has(p.parcelId))}
                        onChange={() => toggleAllUnassignedParcels(unassignedParcels)}
                        className="h-4 w-4 rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-800 uppercase">Tracking ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-800 uppercase">Receiver</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-800 uppercase">Phone</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-neutral-800 uppercase">Destination</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-neutral-800 uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-neutral-800 uppercase">Amount</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-neutral-800 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {unassignedParcels.map((parcel, index) => (
                    <tr key={parcel.parcelId} className={`hover:bg-amber-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedForAssignment.has(parcel.parcelId)}
                          onChange={() => toggleParcelForAssignment(parcel.parcelId)}
                          className="h-4 w-4 rounded border-gray-300 text-[#ea690c] focus:ring-[#ea690c]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold text-[#ea690c]">{parcel.parcelId}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-neutral-800">{parcel.receiverName}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-[#5d5d5d]">{parcel.recieverPhoneNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-neutral-700">{parcel.to?.officeName || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                          parcel.POD ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {parcel.POD ? "POD" : "Regular"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-bold text-[#ea690c]">
                          GHC {((parcel.inboundCost || 0) + (parcel.POD ? (parcel.ItemCost || 0) : 0)).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            onClick={() => setViewParcel(parcel)}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 border-[#ea690c] text-[#ea690c] hover:bg-orange-50 text-xs"
                          >
                            View
                          </Button>
                          <Button
                            onClick={() => handleEditParcel(parcel)}
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 p-0 border-[#d1d1d1] text-green-600 hover:bg-green-50"
                            title="Assign Driver"
                          >
                            <Edit2Icon className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assigned Parcels Section - Keep existing grouped by driver display */}
      {assignedParcels.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-neutral-800">
              Assigned Parcels
            </h3>
            <span className="text-xs text-[#5d5d5d]">
              ({assignedParcels.length} parcel(s) with drivers)
            </span>
          </div>
          {/* Keep existing driver-grouped display here */}
        </div>
      )}
    </>
  );
})()}
```

### Step 7: Add Modal to JSX

Add this before the closing div of the main component:

```tsx
{/* Bulk Driver Assignment Modal */}
{showBulkAssignment && (
  <BulkDriverAssignmentModal
    selectedParcels={parcels.filter(p => selectedForAssignment.has(p.parcelId))}
    onAssign={handleBulkDriverAssignment}
    onClose={() => setShowBulkAssignment(false)}
  />
)}
```

### Step 8: Add Required Imports

Add these imports at the top of the file:

```tsx
import { AlertCircle } from "lucide-react";
```

## 🧪 Testing Checklist

- [ ] Unassigned parcels appear in amber-highlighted section
- [ ] Can select individual parcels with checkboxes
- [ ] "Select all" checkbox works correctly
- [ ] Selected count updates correctly
- [ ] "Assign Driver" button appears when parcels selected
- [ ] Modal opens with correct parcel count
- [ ] Can fill in driver details in modal
- [ ] Validation works (name and vehicle required)
- [ ] Phone number formatting works
- [ ] Assignment updates all selected parcels
- [ ] Success toast appears
- [ ] Parcels move to "Assigned" section after assignment
- [ ] Selection clears after successful assignment
- [ ] Error handling works for failed assignments
- [ ] Loading state shows during assignment
- [ ] Can cancel assignment
- [ ] Modal closes after successful assignment

## 📊 Expected Behavior

### Initial State
- Unassigned parcels section appears at top (if any exist)
- Amber border and background for visibility
- No parcels selected
- "Assign Driver" button hidden

### After Selection
- Checkboxes show selected state
- Count updates in selection bar
- "Assign Driver" button appears with count
- Can deselect parcels

### During Assignment
- Modal shows loading state
- Buttons disabled
- Progress indication

### After Assignment
- Success toast appears
- Parcels move to assigned section
- Selection cleared
- Modal closes
- Page refreshes data

## 🎨 Styling Notes

### Colors
- Amber (#f59e0b) for unassigned section
- Orange (#ea690c) for primary actions
- Green for success states
- Red for errors

### Spacing
- Consistent padding: p-4, p-6
- Gap between elements: gap-2, gap-3, gap-4
- Margins: mb-4, mb-6

### Typography
- Headers: text-base, font-bold
- Body: text-sm, text-xs
- Labels: text-xs, font-semibold, uppercase

## 🚀 Deployment

1. Test thoroughly in development
2. Review code changes
3. Update documentation
4. Deploy to staging
5. User acceptance testing
6. Deploy to production
7. Monitor for issues

## 📝 Documentation Updates

Update these files:
- User manual with bulk assignment instructions
- API documentation if endpoints change
- Training materials for staff
- Release notes

## ✅ Success Criteria

- Users can assign drivers to multiple parcels in one action
- Clear visual distinction between assigned/unassigned
- Fast and reliable bulk updates
- Intuitive user interface
- Proper error handling
- Good performance (< 2s for 50 parcels)

---

**Ready to implement! Follow these steps carefully for a successful deployment.** 🚀
