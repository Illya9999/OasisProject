// ==UserScript==
// @name         Oasis Connector
// @match        *://oasis.moomoo.io/*
// @grant        none
// ==/UserScript==

(() => {
    let ws = window.WebSocket;
    class OasisSocket extends ws {
        constructor(){
            super('ws://127.0.0.1:5000');
        }
    }
    window.WebSocket = OasisSocket;
})();
