# The Oasis project
The goal of the Oasis project is to create a server that is free from hacks and crashes so that it is actually playable

# What does the Oasis currently support?
Here is a list of the features implemented, please note that the project is currently work in progress.
- Player managment: ✓
- Customizability: ✓
- Clans: ✓
- Configurable player limit: ✓
- Leaderboard: ✓
- Minimap: ✓
- Chat: ✓
- PvP: ✓
- Shop: ✓
- Hats: ✓
- Weapons: ✓
- Game Objects: ✓
- Upgrades: ✓
- All Weapons with projectiles: ✘
- Shields: ✘
- Buildable structures (walls, etc): ✘ (being worked on)
- Projectile Physics: ✘
<br>
Everything marked as an X is a planned feature. Other unique features are planned such as multi world servers and game modes.

# Running the server
Because the oasis is in development, ther are no current scripts to ease installation and deplyment of an m.io server. Here are manual instructions
**PLEASE NOTE that running the Oasis Project requires node.js 6.0 or higher**
```
git clone https://github.com/Illya9999/OasisProjec;
cd OasisProjec;
npm install;
npm run test; # Will start the server on port 5000
```

# Starting the client
The Oasis is a *server*, not a client. To use the default moomoo.io client, start the server and
in your browser, install oasis.user.js to tampermoneky or another userscript manager. Then visit oasis.moomoo.io

# Directory roadmap
**THIS STUFF DOESNT REALLY REFLECT THE CURRENT STATE OF THE REPO**
`src/` - The server source code<br>
`tests/` - Test scripts<br>
`packetAnalyzer` - A userscript that is able to capture and log traffic between the Moomoo.io server and client
