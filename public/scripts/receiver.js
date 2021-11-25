const mediacontrolButtons = {
    play : document.getElementById('playbtn'),
    pause : document.getElementById('pausebtn'),
    fwd30 : document.getElementById('30fwd'),
    bwd30 : document.getElementById('30bwd'),
    reconnect : document.getElementById('reconnect'),
    gofull : document.getElementById('fullscreenbtn')
}
const JoinBtn = document.getElementById('joinbutton');
const intro = document.getElementById('intro');
const connectionloader = document.getElementById('connectionloader');
const videoobj = document.getElementById("video");
const notifier = new AWN({position:"top-right"});
window.onload = () => {
    mediacontrolButtons.pause.onclick = () => {
        videoobj.pause(); 
    }
    mediacontrolButtons.play.onclick = () => {
        videoobj.play(); 
    }
    mediacontrolButtons.bwd30.onclick = () => {
        videoobj.currentTime -= 30;
    }
    mediacontrolButtons.fwd30.onclick = () => {
        videoobj.currentTime += 30;
    }
    mediacontrolButtons.reconnect.onclick = init;
    mediacontrolButtons.gofull.onclick = () => {
        videoobj.requestFullscreen().then(r => {

        });
    }
    JoinBtn.onclick = () => {
        JoinBtn.classList.add("hidden");
        connectionloader.classList.remove("hidden");
        init();
    }
    setTimeout(() => {
        intro.classList.add("hidden");
    }, 5000);
}
window.addEventListener("unhandledrejection", function(pre) { 
    console.log(pre);
    //errdesc.innerText=pre.reason;
    notifier.alert(pre.reason.toString(),{
        labels : {alert : "unhandled rejection"},
        durations : { alert : 60000 }
    });
});
async function init() {
    const peer = createPeer();
    peer.addTransceiver("video", { direction: "recvonly" })
}

function createPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.easyvoip.com:3478"
            }
        ]
    });
    peer.ontrack = handleTrackEvent;
    peer.oniceconnectionstatechange = function(event) {
        console.log(peer.iceConnectionState);
      };
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);
    setTimeout(() => {
        connectionloader.classList.add("hidden");
    }, 1000);
    return peer;
}

async function handleNegotiationNeededEvent(peer) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription
    };

    const { data } = await axios.post('/consumer', payload);
    if (data.isBroadcasting) {
        const desc = new RTCSessionDescription(data.sdp);
        peer.setRemoteDescription(desc).catch(e => console.log(e));
    }
    else {
        notifier.alert('There is no broadcast running',{labels : {alert : "No Broadcast"}});
    }
}

function handleTrackEvent(e) {
    videoobj.srcObject = e.streams[0];
};