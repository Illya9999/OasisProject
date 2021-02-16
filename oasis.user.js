// ==UserScript==
// @name         Oasis Connector
// @match        *://oasis.moomoo.io/*
// @grant        none
// ==/UserScript==

(() => {
    let ws = window.WebSocket;
    class OasisSocket extends ws {
        constructor(){
            super(`ws://127.0.0.1:3000/${window.location.search}`);
        }
    }
    window.WebSocket = OasisSocket;
})();
