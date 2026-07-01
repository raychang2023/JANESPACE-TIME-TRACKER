# JaneSpace Logistics Operation Time Tracker

Mobile-first MVP for warehouse sorting staff clock in/out by QR code, with a simple admin dashboard and weekly PNG report generation.

## Install

```bash
npm install
```

## Environment

Create `.env`:

```bash
ADMIN_PASSWORD=your-admin-password
CRON_SECRET=your-cron-secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

All display dates and work-date calculations use `Australia/Sydney`.

## Run

```bash
npm run dev
```

Open `http://localhost:3000/admin/login`.

## Create Employees

1. Log in with `ADMIN_PASSWORD`.
2. Go to `/admin/employees`.
3. Enter name, employee code, and optional phone.
4. The system creates a unique token and scan URL: `/scan/[employeeToken]`.

Inactive employees cannot clock in or out.

## Generate And Download QR Codes

Go to `/admin/employees` and click `Download QR` for an employee. The QR points to the employee scan page.

Set `NEXT_PUBLIC_APP_URL` to your production domain before creating QR codes for real use.

You can also use one shared onsite QR code. Go to `/admin/employees` and click `View Site QR` or `Download Site QR`. This QR opens:

```text
/site-scan
```

Workers scan the shared onsite QR, choose their own name, and then clock in or clock out. The same onsite GPS check still applies.

## Worker Clock In / Clock Out

Workers scan their personal QR code and open:

```text
/scan/[employeeToken]
```

The page shows their name, Sydney date/time, current status, and a large button:

- `Clock In` when no active shift exists.
- `Clock Out` when an active shift exists.

The system prevents duplicate clock-ins and duplicate clock-outs. Multiple shifts in one day are allowed after a shift is completed.

For the shared onsite QR flow, workers open `/site-scan`, select their name, and use the same clock button. This is useful for a printed QR at the warehouse entrance.

## Onsite Location Check

Scan clock-in and clock-out require browser location access. The backend only accepts scan records within 150 meters of an approved warehouse:

```text
24 Madden St, Aitkenvale QLD 4814
Latitude: -19.293479
Longitude: 146.7704773

50-52 Vickers St, Edmonton QLD 4869
Latitude: -16.998416
Longitude: 145.7502424

11 Maisel Cl, Smithfield QLD 4878
Latitude: -16.8217888
Longitude: 145.6911322
```

If location permission is denied, location fails, or the worker is outside the allowed radius, the scan action is rejected and no time record is created. Admin can manually add a record later in `/admin/time-records` with a note.

For phone testing on the same local network, do not use `localhost` in QR codes. Set `NEXT_PUBLIC_APP_URL` to the computer LAN address before generating QR codes:

```text
NEXT_PUBLIC_APP_URL=http://192.168.50.161:3000
```

Then restart the dev server and download/view the QR code again.

## Manage Time Records

Go to `/admin/time-records`.

You can:

- Filter by date and employee.
- Add manual records.
- Edit abnormal records, including forgot clock out.
- Delete incorrect records.
- Add notes such as `late`, `left early`, or `forgot clock out`.

Open records without `clockOutAt` are treated as exceptions and are not counted as completed hours.

Forgotten clock-outs are handled by admin correction. The open record stays uncounted until an admin confirms the actual finish time, edits `clockOutAt`, and adds a note such as `forgot clock out - confirmed by supervisor`.

Completed hours are billed from the 10-minute mark, then increase every 15 minutes:

- 1-9 minutes = `0.00 hrs`
- 10-24 minutes = `0.25 hrs`
- 25-39 minutes = `0.50 hrs`
- 40-54 minutes = `0.75 hrs`
- 55-69 minutes = `1.00 hrs`

Existing historical records are not recalculated automatically. Edited or newly completed records use this rule.

## Generate Weekly Report PNG

Go to `/admin/reports`.

The default week is Monday to Sunday. Click `Generate Report Image` to create a 1080 x 1350 PNG report and save it in:

```text
public/generated/reports
```

Historical report rows are saved in the `weekly_reports` table.

## Sunday 8 PM Cron

The reserved cron endpoint is:

```text
POST /api/cron/generate-weekly-report
```

Send the secret as either:

```text
x-cron-secret: your-cron-secret
```

or:

```text
/api/cron/generate-weekly-report?secret=your-cron-secret
```

For Vercel Cron, schedule it for Sunday 8:00 PM Australia/Sydney. During daylight saving, check UTC conversion carefully. A common server-cron style schedule is:

```cron
0 20 * * 0
```

with the cron runner timezone set to `Australia/Sydney`.

## Staff Weekly Hours Summary

Staff weekly summaries are generated as fixed snapshots for each active employee. Staff can only see their own summary from the personal scan page or from `/site-scan` after selecting their name.

The staff weekly summary uses `Australia/Brisbane` and a Monday to Sunday week.

Generate staff summaries manually or from cron:

```text
POST /api/cron/generate-employee-weekly-reports
```

Send `CRON_SECRET` with either:

```text
x-cron-secret: your-cron-secret
```

or:

```text
/api/cron/generate-employee-weekly-reports?secret=your-cron-secret
```

For Sunday 11:00 PM Brisbane time, configure the cron runner timezone as `Australia/Brisbane` and use:

```cron
0 23 * * 0
```

If admin changes old time records after the weekly summary has been generated, call the endpoint again to refresh that week's employee snapshots.

## Database

SQLite file:

```text
data/janespace.sqlite
```

Tables:

- `employees`
- `time_records`
- `weekly_reports`

The database schema is created automatically on first server request.
