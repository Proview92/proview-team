# Proview Employee: shared server

This small server lets every phone share the same rota, time off, tasks, shifts and notifications.
Without it, each phone keeps its own private copy.

Notifications are **in the app only**: a pop-up message when the app is open, and a number in the browser tab title. There is no push or SMS, so a phone that is asleep sees them when the app is opened again.

## What is in this folder
- `server.js`: the server (no extra packages to install)
- `index.html`: the app itself (the server hands it to every phone)
- `Dockerfile`: for hosting services that run containers
- `package.json`: lets hosting services start it with `npm start`

## Start it (any computer with Node.js 16 or newer)
In this folder run:

    APP_CODE=choose-a-code node server.js

Then open `http://THAT-COMPUTER:3000` on a phone. On Windows use `set APP_CODE=choose-a-code` on one line, then `node server.js` on the next.

Settings, all optional, set before the command:
- `APP_CODE`: a code every phone is asked for once. Strongly recommended. Use 8 or more characters.
- `PORT`: default 3000. Hosting services set this for you.
- `DATA_FILE`: where the data is saved, default `data.json` next to the server. On a hosting service point this at the persistent disk, for example `/data/data.json`.

## Where to host it (pick one)

**1. Where you already host websites (easiest if you have it).** If your Proview websites already run on a server you control, put this folder there and run it the same way.

**2. A hosting service (no server to look after).** Services such as Render, Railway or Fly.io can run the `Dockerfile` or `npm start` straight from this folder. Two things matter:
- It must have a **persistent disk (volume)**, mounted at `/data`. Free plans usually do not have one and also go to sleep, which would lose your data or make the app slow. Choose a small paid plan with a disk.
- Set `APP_CODE` in the service's settings (environment variables). `DATA_FILE` is already set to `/data/data.json` in the Dockerfile.
You get an https address (for example `https://something.onrender.com`) to give to staff.

**3. A small rented server (VPS).** Install Node, copy this folder, keep it running with pm2 (below), and put Caddy or Cloudflare in front for https.

**4. A spare computer at the café.** It works on the café Wi-Fi only, unless you add a tunnel such as Cloudflare Tunnel. Staff at home would not reach it. The computer must stay on.

Whichever you choose, use **https** so the access code is not sent in plain text.

## Keep it running (options 1, 3, 4)

    npm install -g pm2
    APP_CODE=choose-a-code pm2 start server.js --name proview
    pm2 save
    pm2 startup

## Backups
- All data is in one file, `data.json`.
- The server also saves a copy once a day in a `backups` folder next to it and keeps the newest 30.
- To restore: stop the server, copy a backup over `data.json`, start again.
- Now and then, download `data.json` to somewhere else too (a hosting disk can fail).

## Go-live checklist
1. Pick a code and start the server.
2. **Open it first on your own phone.** The first phone to open an empty server uploads its starting data (the café setup). Then choose **Director** and create your own PIN (3 to 6 numbers). You are now signed in.
3. Go to **Settings > Users** and tap **Give everyone a PIN**. It shows a list (name and PIN). Give each person their own PIN privately. They can change it in My profile.
4. Check the setup: People (roles, "Cannot start before", contracted hours), the rota rules, the welcome pack and its attachments.
5. Add the address to the home screen on each phone (Safari: Share, then Add to Home Screen) and give staff the code.
6. Each person picks their name and types their PIN. Their phone remembers them for 90 days or until they sign out.
7. Try one real cover alert with two phones before relying on it.

## Updating the app later
When you get a new `index.html`, replace the old one in this folder and restart the server. Your data stays.

## Good to know
- **Private sign-in is on by default.** Every person signs in with their own PIN, and the server only sends each phone what that person may see: staff get their own payslips, hours, time off and messages; managers get what the owner has switched on for them (Settings > Users). Staff cannot change other people's data even by trying: the server ignores it.
- **Real payslips are now safe to use**, but keep in mind that files still live in the data file on your server, so keep the server and its backups private. Each file should be under 400 KB.
- A new person with no PIN cannot sign in until a manager gives them one (Settings > Users). A person on a trial day gets the phone handed to them by a manager ("Let X confirm now on this phone").
- If someone forgets their PIN, a manager sets a new one in Settings > Users.
- The kiosk (shared clock-in tablet) works from a manager's signed-in phone or tablet; leave that device signed in.
- Wrong PINs are slowed down: after 8 wrong tries from one phone, or 25 for one person, signing in waits ten minutes. Wrong access codes are slowed down too.
- To go back to the old open mode (everyone sees everything, no PINs) start the server with `PRIVATE=0`. Not recommended.
- If the server cannot be reached, the phone keeps working and shows "Offline: not shared", then catches up on its own.
- If you change the access code, phones show "Access code needed"; reload and enter the new one.
- If two people tap "Take this shift" at the same moment, the server gives it to the first and tells the second "Someone else has just taken this shift."
- PINs are stored in the data file as typed, so protect the file and its backups like a password list.
