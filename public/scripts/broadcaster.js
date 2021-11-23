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
    console.log(form.getElementsByTagName("select")[2].value);
    startbtn.classList.add("hidden");
    connectionloader.classList.remove("hidden");
    init({
        videoQuality : form.getElementsByTagName("select")[0].value,
        videoFPS : form.getElementsByTagName("select")[1].value,
        videoBitrate : form.getElementsByTagName("select")[2].value
    },{});
    return false;
}
async function init(videoOptions,audioOptions){
    const stream = await navigator.mediaDevices.getDisplayMedia({
        "audio": true,
        "video": {
            frameRate: videoOptions.videoFPS,
            height: videoOptions.videoQuality
        }
    });
    document.getElementById("video").srcObject = stream;
    connectionloader.classList.add("hidden");

    const peer = createPeer({ bitrate : videoOptions.videoBitrate});
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
}


function createPeer(peerOptions) {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.easyvoip.com:3478"
            }
        ]
    });
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer,peerOptions);
    return peer;
}

async function handleNegotiationNeededEvent(peer,peerOptions) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        peerOptions,
        sdp: peer.localDescription
    };

    const { data } = await axios.post('/broadcast', payload);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}