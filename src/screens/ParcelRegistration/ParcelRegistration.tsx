


import { useState } from "react";
import { ErrorNotificationSection } from "./sections/ErrorNotificationSection";
import { InfoSection } from "./sections/InfoSection";
import { CostsAndPODSection } from "./sections/CostsAndPODSection";
import { ReviewSection } from "./sections/ReviewSection";

interface BulkEntrySession {
  driverName: string;
  vehicleNumber: string;
  entryDate: string;
  parcels: any[];
}

export const ParcelRegistration = (): JSX.Element => {
  const [currentStep, setCurrentStep] = useState(1);
  const [entryMode, setEntryMode] = useState<"single" | "bulk">("single");
  const [bulkSession, setBulkSession] = useState<BulkEntrySession | null>(null);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const startBulkEntry = (driverName: string, vehicleNumber: string) => {
    setBulkSession({
      driverName,
      vehicleNumber,
      entryDate: new Date().toISOString(),
      parcels: [],
    });
    setEntryMode("bulk");
    setCurrentStep(1);
  };

  const addParcelToBulk = (parcelData: any) => {
    if (bulkSession) {
      setBulkSession({
        ...bulkSession,
        parcels: [...bulkSession.parcels, parcelData],
      });
    }
  };

  const endBulkEntry = () => {
    setBulkSession(null);
    setEntryMode("single");
    setCurrentStep(1);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <InfoSection
            onNext={handleNext} entryMode={"single"} onStartBulk={function (driverName: string, vehicleNumber: string): void {
              throw new Error("Function not implemented.");
            }} bulkSession={null} onAddParcel={function (parcelData: any): void {
              throw new Error("Function not implemented.");
            }}          // entryMode={entryMode}
          // onStartBulk={startBulkEntry}
          // bulkSession={bulkSession}
          // onAddParcel={addParcelToBulk}
          />
        );
      case 2:
        return (
          <CostsAndPODSection
            onPrevious={handlePrevious}
            onNext={handleNext} bulkSession={null}          // bulkSession={bulkSession}
          />
        );
      case 3:
        return (
          <ReviewSection
            onPrevious={handlePrevious} bulkSession={null} onEndBulk={function (): void {
              throw new Error("Function not implemented.");
            }}          // bulkSession={bulkSession}
          // onEndBulk={endBulkEntry}
          />
        );
      default:
        return (
          <InfoSection
            onNext={handleNext} entryMode={"single"} onStartBulk={function (driverName: string, vehicleNumber: string): void {
              throw new Error("Function not implemented.");
            }} bulkSession={null} onAddParcel={function (parcelData: any): void {
              throw new Error("Function not implemented.");
            }}          // entryMode={entryMode}
          // onStartBulk={startBulkEntry}
          // bulkSession={bulkSession}
          // onAddParcel={addParcelToBulk}
          />
        );
    }
  };

  return (
    <div className="w-full">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-8 lg:px-12 lg:py-8">
        <div className="flex-1 space-y-6">
          <main className="flex-1 space-y-6">
            {/* Bulk Entry Header */}
            {bulkSession && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900">
                      Bulk Entry Session Active
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Driver: {bulkSession.driverName} | Vehicle: {bulkSession.vehicleNumber} |
                      Parcels: {bulkSession.parcels.length}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <ErrorNotificationSection currentStep={currentStep} />
            {renderStepContent()}
          </main>
        </div>
      </div>
    </div>
  );
};