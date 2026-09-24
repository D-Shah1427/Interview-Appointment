# Google Sheet Cloud Sync Setup Guide (2 Minutes)

This step-by-step guide connects your **Interview Appointment Platform** to a free **Google Sheet**, ensuring:
1. **Real-time synchronization across all devices**: Changes made on your laptop immediately reflect on your phone, tablet, and for other staff members.
2. **Synchronized candidate bookings**: When a candidate books an appointment on their phone or computer, it is instantly visible to other candidates (preventing double bookings) and immediately shows up on your admin portal.
3. **Live Google Sheet spreadsheet**: Every candidate appointment is automatically logged as a formatted row in your Google Sheet for easy tracking by your HR / hiring team.

---

## Step 1: Create a Google Sheet
1. Go to [Google Sheets](https://sheets.new) and create a new blank spreadsheet.
2. Name it something like **Interview Appointments & Bookings**.

---

## Step 2: Open Google Apps Script
1. In the top menu of your Google Sheet, click **Extensions** &rarr; **Apps Script**.
2. A new tab will open with a code editor showing a default `function myFunction() { ... }`.
3. **Delete** all text in the code editor so it is completely empty.

---

## Step 3: Paste the Synchronization Script
Copy and paste the exact code below into the Apps Script editor:

```javascript
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("_AppData") || ss.insertSheet("_AppData");
  var val = sheet.getRange("A1").getValue();
  return ContentService.createTextOutput(val || "{}")
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dataSheet = ss.getSheetByName("_AppData") || ss.insertSheet("_AppData");
    var raw = e.postData.contents;
    dataSheet.getRange("A1").setValue(raw);

    // Populate human-readable "Bookings" sheet tab for HR / Team
    var parsed = JSON.parse(raw);
    if (parsed.bookings && Array.isArray(parsed.bookings)) {
      var bSheet = ss.getSheetByName("Bookings") || ss.insertSheet("Bookings");
      bSheet.clear();
      bSheet.appendRow([
        "Booking ID", "Date", "Time", "Candidate Name", "Email", "Phone",
        "Assigned Panel", "Status", "Booked At"
      ]);
      var header = bSheet.getRange(1, 1, 1, 9);
      header.setBackground("#4f46e5").setFontColor("#ffffff").setFontWeight("bold");

      parsed.bookings.forEach(function(b) {
        var panel = (b.assignedPanel || []).map(function(p) { return p.name; }).join(", ");
        bSheet.appendRow([
          b.id, b.date, b.time, b.candidateName, b.candidateEmail,
          b.candidatePhone || "", panel, b.status, b.bookedAt
        ]);
      });
      bSheet.autoResizeColumns(1, 9);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## Step 4: Deploy as Web App
1. In the top-right corner of the Apps Script window, click the blue **Deploy** button &rarr; **New deployment**.
2. Next to *Select type* (gear icon), choose **Web app**.
3. Fill in the deployment settings:
   - **Description**: `Interview Platform API`
   - **Execute as**: `Me (your email)`
   - **Who has access**: **`Anyone`** *(CRITICAL: This allows candidate browsers and your phone to read/write bookings without Google login prompts)*.
4. Click **Deploy**.
5. If Google asks for authorization:
   - Click **Authorize access**.
   - Select your Google account.
   - Click **Advanced** &rarr; **Go to Untitled project (unsafe)** &rarr; **Allow**.
6. Copy the **Web App URL** (it will look like `https://script.google.com/macros/s/AKfycb.../exec`).

---

## Step 5: Connect in the Admin Dashboard
1. Open your Interview Appointment Platform.
2. In the Admin Dashboard, click the **Cloud Sync** button in the top toolbar.
3. Paste your **Web App URL** into the input field.
4. Click **Save & Connect**.
5. You will see a green confirmation: **Connected and synchronized with Google Sheet / Cloud successfully!**

Done! Now every change made on your laptop, phone, or by any candidate is automatically saved in your Google Sheet and synchronized across all devices in real time.
