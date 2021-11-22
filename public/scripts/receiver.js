const JoinBtn = document.getElementById('joinbutton');
const errdesc = document.getElementById('errordesc');
const notif = document.getElementById('notif');
const intro = document.getElementById('intro');
const notifignore = document.getElementById('notif-ignore');
const playbtn = document.getElementById('playbtn');
const pausebtn = document.getElementById('pausebtn');
const btn30fwd = document.getElementById('30fwd');
const btn30bwd = document.getElementById('30bwd');
const rcnctbtn = document.getElementById('reconnect');
const fullscreenbtn = document.getElementById('fullscreenbtn');
const connectionloader = document.getElementById('connectionloader');
const videoobj = document.getElementById("video");
notifignore.onclick = () => {
    notif.style.display="none";
}

window.onload = () => {
    pausebtn.onclick = () => {
        videoobj.pause(); 
    }
    playbtn.onclick = () => {
        videoobj.play(); 
    }
    btn30bwd.onclick = () => {
        videoobj.currentTime -= 30;
    }
    btn30fwd.onclick = () => {
        videoobj.currentTime += 30;
    }
    rcnctbtn.onclick = init();
    fullscreenbtn.onclick = () => {
        videoobj.requestFullscreen();
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
    errdesc.innerText=pre.reason;
    notif.style.display="flex";
});
async function init() {
    const peer = createPeer();
    peer.addTransceiver("video", { direction: "recvonly" })
}

function createPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.easyvoip.com"
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
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}

function handleTrackEvent(e) {
    videoobj.srcObject = e.streams[0];
};