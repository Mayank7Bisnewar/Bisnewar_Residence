<h1 align="center">
TENANT APP
</h1>

```bash
A tenant and bill management application designed to handle tenants, billing, and WhatsApp messaging with ease.
```

## Technologies Used

This project is built using:
- **Language**: TypeScript
- **Framework**: React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS & shadcn/ui
- **Mobile Integration**: Capacitor
--- 

## Install dependencies: For first time setup

```bash
npm install
```
## Run the build:For first time setup

```bash
npm run build
```
## Getting Started

### 1. Run the Application (Local Dev)
To start the development server and view the app in your browser:
```bash
npm run dev
```
The application will usually be available at `http://localhost:8080`.

### 2. Save Changes & Build Web Assets
To prepare the application for production or native sync:
```bash
npm run build
```

### 3. Update & Build Android APK
Follow these steps to generate a new APK file after making changes:

**Step 1: Sync changes with Android project**
```bash
npx cap sync android
```

**Step 2: Build the APK**
Navigate to the android directory and run the Gradle build.
```bash
cd android
```

Create the configuration file(First time setup or SKIP)
```bash
echo "sdk.dir=$HOME/Library/Android/sdk" > local.properties
```
**Step 3: Note: Requires Java 21**
```bash
 ```

The generated APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## Google Sheets Support

To see your data in a user-friendly spreadsheet format, follow these steps:

1.  **Create a new Google Sheet**.
2.  **Go to Extensions** -> **Apps Script**.
3.  **Paste the code below** into the editor:

```javascript
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var data = JSON.parse(e.postData.contents);
  
  // Add header if sheet is empty
  if (sheet.getLastRow() == 0) {
    sheet.appendRow(["Billed Date", "Paid Date", "Tenant Name", "Room No", "Rent", "Elec Units", "Elec Amount", "Water", "Extra", "Total", "Remarks"]);
  }
  
  // Add the row
  sheet.appendRow([
    data.billedDate,
    data.paidDate,
    data.tenantName,
    data.roomNo,
    data.rent,
    data.electricityUnits,
    data.electricityAmount,
    data.waterAmount,
    data.extraAmount,
    data.totalAmount,
    data.remarks
  ]);
  
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}
```

4.  **Deploy as a Web App**:
    *   Click **Deploy** -> **New Deployment**.
    *   Select type: **Web App**.
    *   Execute as: **Me**.
    *   Who has access: **Anyone**. (This is necessary for the app to send data).
    *   Click **Deploy** and copy the **Web App URL**.

5.  **Configure in the App**:
    *   Open the app, go to the **Summary** tab.
    *   Tap the **Settings (⚙️ icon)**.
    *   Paste the URL into the **Google Sheets Script URL** field and save.

Now, every time you tap **"Record Payment"**, it will automatically add a row to your sheet!

