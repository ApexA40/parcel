import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { StationProvider } from "./contexts/StationContext";
import { MainLayout } from "./layouts/MainLayout";
import { Login } from "./screens/Login";
import { ForgotPassword } from "./screens/ForgotPassword";
import { PasswordRequestSent } from "./screens/PasswordRequestSent";
import { ParcelRegistration } from "./screens/ParcelRegistration";
import { ParcelCostsAndPOD } from "./screens/ParcelCostsAndPOD";
import { ParcelReview } from "./screens/ParcelReview";
import { ParcelSMSSuccess } from "./screens/ParcelSMSSuccess";
import { ParcelSelection } from "./screens/ParcelSelection";
import { ParcelRiderSelection } from "./screens/ParcelRiderSelection";
import { ActiveDeliveries } from "./screens/ActiveDeliveries";
import { Reconciliation } from "./screens/Reconciliation";
import { ReconciliationConfirmation } from "./screens/ReconciliationConfirmation";
import { FinancialDashboard } from "./screens/FinancialDashboard/FinancialDashboard";
import { ShelfManagement } from "./screens/ShelfManagement/ShelfManagement";
import { CallCenter } from "./screens/CallCenter/CallCenter";
import { ParcelSearch } from "./screens/ParcelSearch/ParcelSearch";
import { AdminDashboard } from "./screens/Admin/AdminDashboard/AdminDashboard";
import { StationManagement } from "./screens/Admin/StationManagement/StationManagement";
import { UserManagement } from "./screens/Admin/UserManagement/UserManagement";
import { SystemParcelOverview } from "./screens/Admin/SystemParcelOverview/SystemParcelOverview";
import { FinancialReports } from "./screens/Admin/FinancialReports/FinancialReports";
import { DriverPaymentsOverview } from "./screens/Admin/DriverPaymentsOverview/DriverPaymentsOverview";

export const App = (): JSX.Element => {
  return (
    <StationProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/password-request-sent" element={<PasswordRequestSent />} />

          {/* Main Routes */}
          <Route
            path="/"
            element={
              <MainLayout>
                <Navigate to="/parcel-intake" replace />
              </MainLayout>
            }
          />

          <Route
            path="/parcel-intake"
            element={
              <MainLayout>
                <ParcelRegistration />
              </MainLayout>
            }
          />
          <Route
            path="/parcel-search"
            element={
              <MainLayout>
                <ParcelSearch />
              </MainLayout>
            }
          />
          <Route
            path="/call-center"
            element={
              <MainLayout>
                <CallCenter />
              </MainLayout>
            }
          />
          <Route
            path="/parcel-costs-pod"
            element={
              <MainLayout>
                <ParcelCostsAndPOD />
              </MainLayout>
            }
          />
          <Route
            path="/parcel-review"
            element={
              <MainLayout>
                <ParcelReview />
              </MainLayout>
            }
          />
          <Route
            path="/parcel-sms-success"
            element={
              <MainLayout>
                <ParcelSMSSuccess />
              </MainLayout>
            }
          />
          <Route
            path="/package-assignments"
            element={
              <MainLayout>
                <ParcelSelection />
              </MainLayout>
            }
          />
          <Route
            path="/rider-selection"
            element={
              <MainLayout>
                <ParcelRiderSelection />
              </MainLayout>
            }
          />
          <Route
            path="/active-deliveries"
            element={
              <MainLayout>
                <ActiveDeliveries />
              </MainLayout>
            }
          />
          <Route
            path="/reconciliation"
            element={
              <MainLayout>
                <Reconciliation />
              </MainLayout>
            }
          />
          <Route
            path="/reconciliation-confirmation"
            element={
              <MainLayout>
                <ReconciliationConfirmation />
              </MainLayout>
            }
          />
          <Route
            path="/financial-dashboard"
            element={
              <MainLayout>
                <FinancialDashboard />
              </MainLayout>
            }
          />
          <Route
            path="/shelf-management"
            element={
              <MainLayout>
                <ShelfManagement />
              </MainLayout>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            }
          />

          <Route
            path="/admin/stations"
            element={
              <MainLayout>
                <StationManagement />
              </MainLayout>
            }
          />

          <Route
            path="/admin/users"
            element={
              <MainLayout>
                <UserManagement />
              </MainLayout>
            }
          />

          <Route
            path="/admin/parcels"
            element={
              <MainLayout>
                <SystemParcelOverview />
              </MainLayout>
            }
          />

          <Route
            path="/admin/financial-reports"
            element={
              <MainLayout>
                <FinancialReports />
              </MainLayout>
            }
          />

          <Route
            path="/admin/driver-payments"
            element={
              <MainLayout>
                <DriverPaymentsOverview />
              </MainLayout>
            }
          />
        </Routes>
      </BrowserRouter>
    </StationProvider>
  );
};

