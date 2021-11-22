const startbtn = document.getElementById('start-stream');
const endbtn = document.getElementById('end-stream');
const connectionloader = document.getElementById('connectionloader');
window.onload = () => {
    // startbtn.onclick = () => {
    //     init();
    // }
   
}
function startBroadcast(form){
    console.log(form.getElementsByTagName("select")[0].value);
    console.log(form.getElementsByTagName("select")[1].value);
    startbtn.classList.add("hidden");
    connectionloader.classList.remove("hidden");
    init(form.getElementsByTagName("select")[0].value,form.getElementsByTagName("select")[1].value);
    return false;
}
async function init(videoHG,videoFPS) {
    const stream = await navigator.mediaDevices.getDisplayMedia({
        "audio": true,
        "video": {
            "frameRate": videoFPS,
            height: videoHG
        }
    });
    document.getElementById("video").srcObject = stream;
    connectionloader.classList.add("hidden");

    const peer = createPeer();
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
}


function createPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.easyvoip.com"
            }
        ]
    });
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);
    return peer;
}

async function handleNegotiationNeededEvent(peer) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription
    };

    const { data } = await axios.post('/broadcast', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}