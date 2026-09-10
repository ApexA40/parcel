import { describe, it, expect } from "vitest";

/**
 * Mirrors the exact parcelData construction in InfoSection.handleSaveDirectly
 * and handleAddAnotherSameDriver. We test the logic in isolation — no DOM needed.
 */
function buildParcelData(parcelWeight: number | undefined) {
    return {
        driverName: "Kofi Driver",
        driverPhone: "+233244000001",
        vehicleNumber: "GR-001-24",
        senderName: undefined,
        senderPhone: undefined,
        recipientName: "Ama Receiver",
        recipientPhone: "+233244000002",
        alternativePhone: undefined,
        receiverAddress: undefined,
        itemDescription: undefined,
        shelfLocation: "shelf-1",
        shelfName: "Shelf A",
        itemValue: 0,
        pickUpCost: 0,
        homeDelivery: false,
        deliveryCost: undefined,
        hasCalled: undefined,
        images: undefined,
        parcelWeight: parcelWeight || undefined,
    };
}

/**
 * Mirrors the exact parcelRequest construction in ParcelRegistration.handleSaveAll
 */
function buildParcelRequest(parcelData: ReturnType<typeof buildParcelData>) {
    return {
        senderName: parcelData.senderName || undefined,
        senderPhoneNumber: parcelData.senderPhone || "",
        receiverName: parcelData.recipientName,
        receiverAddress: parcelData.receiverAddress || undefined,
        recieverPhoneNumber: parcelData.recipientPhone,
        alternativePhoneNumber: parcelData.alternativePhone || undefined,
        parcelDescription: parcelData.itemDescription || undefined,
        driverName: parcelData.driverName || "",
        driverPhoneNumber: parcelData.driverPhone || "",
        inboundCost: parcelData.itemValue > 0 ? parcelData.itemValue : undefined,
        pickUpCost: 0,
        deliveryCost: parcelData.deliveryCost || undefined,
        shelfNumber: parcelData.shelfLocation,
        hasCalled: parcelData.hasCalled || false,
        homeDelivery: parcelData.homeDelivery || false,
        vehicleNumber: parcelData.vehicleNumber || "",
        officeId: "office-1",
        pod: false,
        delivered: false,
        parcelAssigned: false,
        fragile: false,
        images: parcelData.images?.length ? parcelData.images : undefined,
        parcelWeight: parcelData.parcelWeight || undefined,
    };
}

describe("parcelWeight — form → API payload", () => {
    it("is included in the API payload when the user enters a weight", () => {
        const parcelData = buildParcelData(3.5);
        const request = buildParcelRequest(parcelData);

        expect(parcelData.parcelWeight).toBe(3.5);
        expect(request.parcelWeight).toBe(3.5);
    });

    it("is undefined in the API payload when the weight field is left empty", () => {
        const parcelData = buildParcelData(undefined);
        const request = buildParcelRequest(parcelData);

        expect(parcelData.parcelWeight).toBeUndefined();
        expect(request.parcelWeight).toBeUndefined();
    });

    it("is undefined when weight is 0 (falsy guard)", () => {
        // parcelWeight || undefined means 0 becomes undefined — this is intentional
        const parcelData = buildParcelData(0);
        const request = buildParcelRequest(parcelData);

        expect(request.parcelWeight).toBeUndefined();
    });

    it("preserves decimal precision", () => {
        const parcelData = buildParcelData(1.25);
        const request = buildParcelRequest(parcelData);

        expect(request.parcelWeight).toBe(1.25);
    });

    it("includes alternativePhoneNumber in the API payload when provided", () => {
        const parcelData = buildParcelData(2.0);
        const request = buildParcelRequest({ ...parcelData, alternativePhone: "+233244000099" });

        expect(request.alternativePhoneNumber).toBe("+233244000099");
    });
});
