const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

exports.sendNotification = onDocumentCreated("notification_requests/{requestId}", async (event) => {
    const data = event.data.data();
    if (!data) return;

    const { tenantId, message } = data;

    try {
        // Fetch the tenant's public view to get the FCM token
        const viewDoc = await admin.firestore().collection("public_tenant_views").doc(tenantId).get();
        if (!viewDoc.exists) {
            console.log("Tenant view not found:", tenantId);
            return;
        }

        const viewData = viewDoc.data();
        const fcmToken = viewData.fcmToken;

        if (!fcmToken) {
            console.log("No FCM token found for tenant:", tenantId);
            return;
        }

        // Send push notification
        const payload = {
            token: fcmToken,
            notification: {
                title: "Rent Update",
                body: message || "Your rent details have been updated. Tap to view.",
            },
            data: {
                tenantId: tenantId,
                click_action: "FLUTTER_NOTIFICATION_CLICK" // default for capacitor compatibility
            }
        };

        await admin.messaging().send(payload);
        console.log("Successfully sent push notification to", tenantId);
        
        // Delete the request after sending to save space
        await event.data.ref.delete();

    } catch (error) {
        console.error("Error sending push notification:", error);
    }
});
