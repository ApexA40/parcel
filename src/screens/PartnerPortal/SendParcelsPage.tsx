import { useState, useEffect } from "react";
import { Send, Plus, Trash2, CheckCircle2, Building2, Edit2 } from "lucide-react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  EMPTY_FORM, MOCK_STATIONS, formatCurrency, generateTrackingId,
  type SendParcelForm, type PartnerParcel,
} from "./partnerData";

const PARTNER_PROFILE_KEY = "mm_partner_profile";

interface PartnerProfile {
  businessName: string;
  contactPhone: string;
}

function getStoredProfile(): PartnerProfile | null {
  try {
    const raw = localStorage.getItem(PARTNER_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveProfile(p: PartnerProfile) {
  localStorage.setItem(PARTNER_PROFILE_KEY, JSON.stringify(p));
}

interface Props {
  onSubmit: (parcels: PartnerParcel[]) => void;
}

export const SendParcelsPage = ({ onSubmit }: Props) => {
  const [profile, setProfile] = useState<PartnerProfile | null>(getStoredProfile);
  const [showProfileSetup, setShowProfileSetup] = useState(!getStoredProfile());
  const [profileDraft, setProfileDraft] = useState<PartnerProfile>({ businessName: "", contactPhone: "" });
  const [editingProfile, setEditingProfile] = useState(false);

  const [form, setForm] = useState<SendParcelForm>({
    ...EMPTY_FORM,
    senderName: getStoredProfile()?.businessName || "",
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof SendParcelForm, string>>>({});
  const [batch, setBatch] = useState<SendParcelForm[]>([]);
  const [bulkMode, setBulkMode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Keep senderName in sync with profile
  useEffect(() => {
    if (profile?.businessName) {
      setForm(prev => ({ ...prev, senderName: profile.businessName }));
    }
  }, [profile]);

  const saveProfileAndContinue = () => {
    if (!profileDraft.businessName.trim()) return;
    saveProfile(profileDraft);
    setProfile(profileDraft);
    setShowProfileSetup(false);
    setEditingProfile(false);
    setForm(prev => ({ ...prev, senderName: profileDraft.businessName }));
  };

  const setField = (field: keyof SendParcelForm) => (value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const validate = (): boolean => {
    const errs: Partial<Record<keyof SendParcelForm, string>> = {};
    if (!form.senderName) errs.senderName = "Required";
    if (!form.receiverName) errs.receiverName = "Required";
    if (!form.receiverPhone) errs.receiverPhone = "Required";
    if (!form.stationId) errs.stationId = "Required";
    if (!form.deliveryFee) errs.deliveryFee = "Required";
    if (form.pod && !form.itemCost) errs.itemCost = "Required for POD";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const addToBatch = () => {
    if (!validate()) return;
    setBatch(prev => [...prev, form]);
    setForm(prev => ({ ...EMPTY_FORM, senderName: prev.senderName, stationId: prev.stationId }));
    setFormErrors({});
  };

  const handleSubmit = async () => {
    const toSubmit = bulkMode ? batch : (validate() ? [form] : null);
    if (!toSubmit || toSubmit.length === 0) return;
    const count = toSubmit.length;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    const ids: string[] = [];
    const newParcels: PartnerParcel[] = toSubmit.map(f => {
      const tid = generateTrackingId();
      ids.push(tid);
      return {
        id: Date.now().toString() + Math.random(),
        trackingId: tid,
        senderName: f.senderName,
        receiverName: f.receiverName,
        receiverPhone: f.receiverPhone,
        receiverAltPhone: f.receiverAltPhone,
        receiverAddress: f.receiverAddress,
        description: f.description,
        weight: f.weight,
        itemCount: f.itemCount,
        station: MOCK_STATIONS.find(s => s.id === f.stationId)?.name || "",
        stationId: f.stationId,
        itemCost: parseFloat(f.itemCost || "0"),
        deliveryFee: parseFloat(f.deliveryFee || "0"),
        pod: f.pod,
        status: "pending",
        submittedAt: new Date().toISOString(),
      };
    });
    onSubmit(newParcels);
    setSubmittedCount(count);
    setSubmittedIds(ids);
    setSubmitting(false);
    setSubmitSuccess(true);
    setForm({ ...EMPTY_FORM, senderName: profile?.businessName || "" });
    setBatch([]);
  };

  // ── Profile setup modal ──
  if (showProfileSetup) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md border border-[#d1d1d1] bg-white shadow-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-800">Set Up Your Business Profile</h3>
                <p className="text-xs text-gray-500">This will auto-fill as sender on all your parcels</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800">Business / Shop Name <span className="text-red-500">*</span></Label>
                <Input
                  value={profileDraft.businessName}
                  onChange={e => setProfileDraft(p => ({ ...p, businessName: e.target.value }))}
                  placeholder="e.g. Jumia, My Online Shop..."
                  className="border border-[#d1d1d1]"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800">Contact Phone</Label>
                <Input
                  value={profileDraft.contactPhone}
                  onChange={e => setProfileDraft(p => ({ ...p, contactPhone: e.target.value }))}
                  placeholder="+233 XX XXX XXXX"
                  className="border border-[#d1d1d1]"
                />
              </div>
              <Button
                onClick={saveProfileAndContinue}
                disabled={!profileDraft.businessName.trim()}
                className="w-full bg-[#ea690c] text-white hover:bg-[#d45e0a] disabled:opacity-50 h-10"
              >
                Save &amp; Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Success screen ──
  if (submitSuccess) {
    return (
      <div className="space-y-5 pb-10">
        <Card className="border border-green-200 bg-green-50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="text-base font-bold text-green-800">
                  {submittedCount} Parcel{submittedCount > 1 ? "s" : ""} Submitted Successfully!
                </h3>
                <p className="text-xs text-green-600 mt-0.5">Your parcels have been registered with M&amp;M. Keep these tracking IDs.</p>
              </div>
            </div>
            <div className="space-y-2 mb-5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tracking ID{submittedIds.length > 1 ? "s" : ""}</p>
              {submittedIds.map(id => (
                <div key={id} className="flex items-center gap-3 bg-white border border-green-200 rounded-lg px-4 py-2.5">
                  <span className="font-mono text-sm font-bold text-[#ea690c]">{id}</span>
                  <span className="text-xs text-gray-400 ml-auto">Pending</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setSubmitSuccess(false)}
                className="flex-1 bg-[#ea690c] text-white hover:bg-[#d45e0a]"
              >
                Send More Parcels
              </Button>
              <Button
                onClick={() => { setSubmitSuccess(false); }}
                variant="outline"
                className="flex-1 border-[#ea690c] text-[#ea690c] hover:bg-orange-50"
              >
                View in Tracker
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">

      {/* Sender profile bar */}
      <div className="flex items-center justify-between bg-white border border-[#d1d1d1] rounded-xl px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Sending as</p>
            <p className="text-sm font-bold text-neutral-800">{profile?.businessName}</p>
          </div>
        </div>
        <button
          onClick={() => { setProfileDraft(profile || { businessName: "", contactPhone: "" }); setEditingProfile(true); setShowProfileSetup(true); }}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#ea690c] transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-neutral-800">Register {bulkMode ? "Multiple Parcels" : "a Parcel"}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Fill in receiver details and choose a destination station</p>
        </div>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <span className="text-sm text-gray-600 font-medium">Bulk Mode</span>
          <div
            onClick={() => { setBulkMode(v => !v); setBatch([]); }}
            className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${bulkMode ? "bg-[#ea690c]" : "bg-gray-300"}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${bulkMode ? "translate-x-6" : "translate-x-1"}`} />
          </div>
        </label>
      </div>

      <Card className="border border-[#d1d1d1] bg-white shadow-sm">
        <CardContent className="p-6 space-y-6">

          {/* Section 1 — Sender */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-[#ea690c] text-xs font-bold flex items-center justify-center">1</span>
              Sender Details
            </h3>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-neutral-800">Sender / Business Name <span className="text-red-500">*</span></Label>
              <Input
                value={form.senderName}
                onChange={e => setField("senderName")(e.target.value)}
                placeholder="Your business name"
                className={`border ${formErrors.senderName ? "border-red-400" : "border-[#d1d1d1]"}`}
              />
              {formErrors.senderName && <p className="text-xs text-red-500">{formErrors.senderName}</p>}
              <p className="text-xs text-gray-400">Auto-filled from your profile. Edit if sending on behalf of another business.</p>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Section 2 — Receiver */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-[#ea690c] text-xs font-bold flex items-center justify-center">2</span>
              Receiver Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800">Full Name <span className="text-red-500">*</span></Label>
                <Input value={form.receiverName} onChange={e => setField("receiverName")(e.target.value)}
                  placeholder="John Doe"
                  className={`border ${formErrors.receiverName ? "border-red-400" : "border-[#d1d1d1]"}`} />
                {formErrors.receiverName && <p className="text-xs text-red-500">{formErrors.receiverName}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800">Phone Number <span className="text-red-500">*</span></Label>
                <Input value={form.receiverPhone} onChange={e => setField("receiverPhone")(e.target.value)}
                  placeholder="+233 XX XXX XXXX"
                  className={`border ${formErrors.receiverPhone ? "border-red-400" : "border-[#d1d1d1]"}`} />
                {formErrors.receiverPhone && <p className="text-xs text-red-500">{formErrors.receiverPhone}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800">Alternative Phone</Label>
                <Input value={form.receiverAltPhone} onChange={e => setField("receiverAltPhone")(e.target.value)}
                  placeholder="+233 XX XXX XXXX (optional)"
                  className="border border-[#d1d1d1]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800">Delivery Address</Label>
                <Input value={form.receiverAddress} onChange={e => setField("receiverAddress")(e.target.value)}
                  placeholder="Street, Area, City" className="border border-[#d1d1d1]" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Section 3 — Parcel Info */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-[#ea690c] text-xs font-bold flex items-center justify-center">3</span>
              Parcel Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-3">
                <Label className="text-xs font-semibold text-neutral-800">Item Description</Label>
                <Input value={form.description} onChange={e => setField("description")(e.target.value)}
                  placeholder="e.g. Electronics, Clothing, Shoes..." className="border border-[#d1d1d1]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800">Weight (kg)</Label>
                <Input type="number" min="0" step="0.1" value={form.weight}
                  onChange={e => setField("weight")(e.target.value)}
                  placeholder="e.g. 1.5" className="border border-[#d1d1d1]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800">Number of Items</Label>
                <Input type="number" min="1" value={form.itemCount}
                  onChange={e => setField("itemCount")(e.target.value)}
                  placeholder="e.g. 2" className="border border-[#d1d1d1]" />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100" />

          {/* Section 4 — Station + Costs */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-[#ea690c] text-xs font-bold flex items-center justify-center">4</span>
              Station &amp; Pricing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800">Destination Station <span className="text-red-500">*</span></Label>
                <select
                  value={form.stationId}
                  onChange={e => setField("stationId")(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ea690c] ${formErrors.stationId ? "border-red-400" : "border-[#d1d1d1]"}`}
                >
                  <option value="">Select a station</option>
                  {MOCK_STATIONS.map(s => (
                    <option key={s.id} value={s.id}>{s.name} — {s.location}</option>
                  ))}
                </select>
                {formErrors.stationId && <p className="text-xs text-red-500">{formErrors.stationId}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800">Delivery Fee (GHC) <span className="text-red-500">*</span></Label>
                <Input type="number" min="0" value={form.deliveryFee}
                  onChange={e => setField("deliveryFee")(e.target.value)}
                  placeholder="e.g. 20"
                  className={`border ${formErrors.deliveryFee ? "border-red-400" : "border-[#d1d1d1]"}`} />
                {formErrors.deliveryFee && <p className="text-xs text-red-500">{formErrors.deliveryFee}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-neutral-800">
                  Item Cost (GHC) {form.pod && <span className="text-red-500">*</span>}
                </Label>
                <Input type="number" min="0" value={form.itemCost}
                  onChange={e => setField("itemCost")(e.target.value)}
                  disabled={!form.pod}
                  placeholder={form.pod ? "e.g. 350" : "Enable POD first"}
                  className={`border ${formErrors.itemCost ? "border-red-400" : "border-[#d1d1d1]"} disabled:bg-gray-50 disabled:text-gray-400`} />
                {formErrors.itemCost && <p className="text-xs text-red-500">{formErrors.itemCost}</p>}
              </div>
            </div>

            <label className="flex items-center gap-2.5 mt-4 cursor-pointer w-fit">
              <input type="checkbox" checked={form.pod}
                onChange={e => { setField("pod")(e.target.checked); if (!e.target.checked) setField("itemCost")(""); }}
                className="w-4 h-4 accent-[#ea690c] rounded" />
              <div>
                <span className="text-sm font-medium text-neutral-800">Payment on Delivery (POD)</span>
                <p className="text-xs text-gray-400">Recipient pays item cost + delivery fee upon collection</p>
              </div>
            </label>
          </div>

          {/* Cost summary */}
          {(form.deliveryFee || form.itemCost) && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100/40 border border-orange-200 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-[#ea690c] uppercase tracking-wider mb-2">Cost Summary</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-medium">GHC {parseFloat(form.deliveryFee || "0").toFixed(2)}</span>
                </div>
                {form.pod && (
                  <div className="flex justify-between text-gray-600">
                    <span>Item Cost (POD)</span>
                    <span className="font-medium">GHC {parseFloat(form.itemCost || "0").toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[#ea690c] border-t border-orange-200 pt-1.5 mt-1.5">
                  <span>Total to Collect from Recipient</span>
                  <span>GHC {(parseFloat(form.deliveryFee || "0") + (form.pod ? parseFloat(form.itemCost || "0") : 0)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Bulk batch */}
          {bulkMode && (
            <div className="space-y-3 border-t border-gray-100 pt-4">
              <Button type="button" onClick={addToBatch}
                className="flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700">
                <Plus className="w-4 h-4" /> Add to Batch
              </Button>
              {batch.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{batch.length} parcel(s) in batch</p>
                  {batch.map((b, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-[#d1d1d1] bg-gray-50 px-4 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-neutral-800">{b.receiverName}</p>
                        <p className="text-xs text-gray-500">{b.receiverPhone} · {MOCK_STATIONS.find(s => s.id === b.stationId)?.name} · {formatCurrency(parseFloat(b.deliveryFee || "0") + (b.pod ? parseFloat(b.itemCost || "0") : 0))}</p>
                      </div>
                      <button onClick={() => setBatch(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600 ml-3 p-1 hover:bg-red-50 rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-1 border-t border-gray-100">
            <Button
              onClick={handleSubmit}
              disabled={submitting || (bulkMode && batch.length === 0)}
              className="flex items-center gap-2 bg-[#ea690c] text-white hover:bg-[#d45e0a] disabled:opacity-50 px-8 h-10"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4" /> {bulkMode ? `Submit ${batch.length || ""} Parcel${batch.length !== 1 ? "s" : ""}` : "Submit Parcel"}</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
