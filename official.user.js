// ==UserScript==
// @name         Oasis Connector
// @match        *://oasis.moomoo.io/*
// @grant        none
// ==/UserScript==

(() => {
    let ws = window.WebSocket;
    class OasisSocket extends ws {
        constructor(){
            let type = window.location.protocol === 'http:' ? 'ws' : 'wss';
            super(`${type}://oasis-x.glitch.me/`);
        }
    }
    window.WebSocket = OasisSocket;
})();
