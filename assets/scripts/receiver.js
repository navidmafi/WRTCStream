// © Copyright Navid Mafi Ranji 2021 . <navidmafi2006@gmail.com> ALL RIGHT RESERVED

//TODO REMOVE CONTROLS FROM VIDEO
const mediacontrolButtons = {
    playpause: document.getElementById('pausebtn'),
    fwd30: document.getElementById('30fwd'),
    bwd30: document.getElementById('30bwd'),
    reconnect: document.getElementById('reconnect'),
    gofull: document.getElementById('fullscreenbtn')
}
const JoinBtn = document.getElementById('joinbutton');
const intro = document.getElementById('intro');
const connectionloader = document.getElementById('connectionloader');
const videoobj = document.getElementById("video");
const headerbar = document.getElementById('headerbar');
const btmbar = document.getElementById("btmbar");
const mediaInfo = {
    videoQuality: document.querySelector('#videoqualityPlaceholder'),
    videoBR: document.querySelector('#videobitratePlaceholder'),
    audioBR: document.querySelector('#audiobitratePlaceholder')
}
const notifier = new AWN({position: "top-right"});
const footerStats = document.getElementById('footerstat');

let lastResult;
let streamPlaybackState = false;
window.onload = () => {
    mediacontrolButtons.playpause.onclick = () => {
        if (streamPlaybackState) {
            videoobj.pause();
            mediacontrolButtons.playpause.children[0].innerText = "play_arrow";
            streamPlaybackState = false;
        } else {
            videoobj.play();
            mediacontrolButtons.playpause.children[0].innerText = "pause";
            streamPlaybackState = true;
        }

    }
    mediacontrolButtons.bwd30.onclick = () => {
        videoobj.currentTime -= 30;
    }
    mediacontrolButtons.fwd30.onclick = () => {
        videoobj.currentTime += 30;
    }
    mediacontrolButtons.reconnect.onclick = init;
    mediacontrolButtons.gofull.onclick = () => {
        videoobj.requestFullscreen();
    }
    JoinBtn.onclick = () => {
        JoinBtn.classList.add("hidden");
        connectionloader.classList.remove("hidden");
        init();
    }
    setTimeout(() => {
        intro.remove();
    }, 4000);


}
window.addEventListener("unhandledrejection", function (pre) {
    notifier.alert(pre.reason.toString(), {
        labels: {alert: "unhandled rejection"}
    });
    JoinBtn.classList.remove("hidden");
});

async function init() {
    const peer = createPeer();
    peer.addTransceiver("video", {direction: "recvonly"});
    peer.addTransceiver("audio", {direction: "recvonly"});
}

function createPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            {urls: "stun:stun1.l.google.com:19302"},
            {urls: "stun:stun2.l.google.com:19302"},
            {urls: "stun:stun3.l.google.com:19302"},
            {urls: "stun:stun.nextcloud.com:443"}
        ]
    });

    peer.ontrack = handleTrackEvent;
    peer.oniceconnectionstatechange = function (event) {
        console.log(event);
        console.log(peer.iceConnectionState);
    };
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);
    setTimeout(() => {
        connectionloader.classList.add("hidden");
    }, 1000);
    return peer;
}

async function handleNegotiationNeededEvent(peer) {
    for (let receiver in peer.getReceivers()) {
        //peer.getReceivers()[receiver].playoutDelayHint = 5;
        peer.getReceivers()[receiver].jitterBufferDelayHint  = 1;
    }

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription
    };

    const {data} = await axios.post('/api/consumer', payload);

    if (data.isBroadcasting) {
        mediaInfo.videoQuality.innerText = data.mediaOptions.videoOptions.videoQuality + 'p ' + data.mediaOptions.videoOptions.videoFPS + 'FPS';
        mediaInfo.videoBR.innerText = 'V: ' + data.mediaOptions.videoOptions.videoBitrate + 'Kbps';
        mediaInfo.audioBR.innerText = 'A: ' + data.mediaOptions.audioOptions.audioBitrate + 'Kbps';
        const desc = new RTCSessionDescription(data.sdp);
        peer.setRemoteDescription(desc).catch(e => console.log(e));
        peer.ondatachannel = (e) => {
            console.log(e)
        };
    } else {
        notifier.warning('There is no broadcast running', {labels: {warning: "No Broadcast"}});
        JoinBtn.classList.remove("hidden");
        connectionloader.classList.add("hidden");
    }
}

function handleTrackEvent(e) {
    videoobj.srcObject = e.streams[0];
    setTimeout(function () {
        btmbar.style.opacity = "0";
        headerbar.style.opacity = "0";
    }, 2000);
    btmbar.addEventListener('mouseleave', function () {
        setTimeout(function () {
            btmbar.style.opacity = "0";
            headerbar.style.opacity = "0";
        }, 2000)
    });
    btmbar.addEventListener('mouseenter', function () {
        btmbar.style.opacity = "1";
        headerbar.style.opacity = "1";
    });
    mediacontrolButtons.playpause.children[0].innerText = "pause";
    streamPlaybackState = true;
}

