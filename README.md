# Table of contents
1) What is it?
2) What it does?
3) Why would you do this
4) Why for free? Where is the catch?
5) Details
6) How can I install this?
7) What is current version?
8) There's something to improve?

# 1) What is it?
It is an extension for Chrome browser. It is designed to be maximally simple.
# 2) What is does?
It auto-saves current session (windows, tabs) and allows to restore them in case of a browser crash/power failure/accidental close/etc.
The only function of the extension is to save your tabs to your disk and let you open them again. You can see the code here – there's nothing more, no ads, no spam, no data collecting, no XHRs…
PRIORITY is on reliable saving, reliable restoring and low resources (RAM, CPU).
# 3) Why would you do this?
I know Chrome can restore tabs. But didn't it happen to you that once Chrome couldn't make it? To me – multiple times.
# 4) Why for free? Where is the catch?
I'm not a software developer. I'm a hobby coder. I made it for me and my wife. Why not publish it?
# 5) Details
• Auto-saving (every 5 minutes by default – you can change it). Auto-save is postponed if nothing changed.
• You can restore any singular tab, many tabs or whole window, even multiple windows – everything that was open.
• We have 5 MB to use for this purpose ;) As it saves every 5 minutes I decided to use 20% (you can change it), and for me this makes about 30 of last saved sessions with 25-30 tabs each.
• If you want you can permit it in Incognito mode – it can also restore Incognito window as Incognito again.
• You can remove specific sessions.
# 6) How can I install this?
1. Open main repository → https://github.com/Vinne2/SessionRestore-for-chrome
2. Download (click green button "Clone or dowload" and "Download ZIP").
3. Unzip to any place you like (but a place that it won't get deleted!). Remember THAT folder.
4. In Chrome go to chrome://extensions/ and check the "Developer mode" in the top right.
6. Click "Load unpacked extension" button in the top left and select THAT folder.
# 7) What is current version?
See in manifest.json.
# 8) In case of problems with the extension…
…let me know. Submit an issue.