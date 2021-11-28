// © Copyright Navid Mafi Ranji 2021 . <navidmafi2006@gmail.com> ALL RIGHT RESERVED


const startbtn = document.getElementById('start-stream');
const endbtn = document.getElementById('end-stream');
const connectionloader = document.getElementById('connectionloader');
const notifier = new AWN({position:"top-right"});

//TODO ROOM ID ON WINDOW.ONLOAD
document.addEventListener('visibilitychange', function(ev) {
    console.log(`Tab state : ${document.visibilityState}`);
});
function startBroadcast(form){

    startbtn.disabled = true;
    connectionloader.classList.remove("hidden");
    form.getElementsByTagName("input")[0].style.display = "none";
    init({
        token : form.getElementsByTagName("input")[0].value
    },{
        audioOptions : {
            audioBitrate : form.getElementsByTagName("select")[3].value
        },
        videoOptions : {
            videoQuality : form.getElementsByTagName("select")[0].value,
            videoFPS : form.getElementsByTagName("select")[1].value,
            videoBitrate : form.getElementsByTagName("select")[2].value
        }
    });
    return false;
}
async function init(clientOptions,mediaOptions){
    const stream = await navigator.mediaDevices.getDisplayMedia({
        "audio": true,
        "video": {
            frameRate: mediaOptions.videoOptions.videoFPS,
            height: mediaOptions.videoOptions.videoQuality
        }
    });
    document.getElementById("video").srcObject = stream;
    connectionloader.classList.add("hidden");
    const peer = createPeer(clientOptions,mediaOptions);
    stream.getTracks().forEach(track => {
        track.onended = (track) => {

        }
        peer.addTrack(track, stream);
        console.log(track);
    });
    console.log(peer);
}


function createPeer(clientOptions,mediaOptions) {
    const peer = new RTCPeerConnection({
        iceServers: [
            {urls: "stun:stun1.l.google.com:19302"},
            {urls: "stun:stun2.l.google.com:19302"},
            {urls: "stun:stun3.l.google.com:19302"},
            {urls: "stun:stun.nextcloud.com:443"}

        ]
    });
    const eventsChannel = peer.createDataChannel("RTCEvents");
    eventsChannel.onopen = event => {
        eventsChannel.send('Hi you!');
        console.log('sent' ,event);
    };
    eventsChannel.onmessage = event => {
        console.log(event.data);
    }
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer,clientOptions,mediaOptions);
    return peer;
}

async function handleNegotiationNeededEvent(peer,clientOptions,mediaOptions) {
    const offer = await peer.createOffer();
    console.log(offer);
    await peer.setLocalDescription(offer);
    const payload = {
        clientOptions,
        mediaOptions,
        sdp: peer.localDescription
    };

    const { data } = await axios.post('/broadcast', payload , {timeout : 3000});
    if (data.authStatus) {
        const desc = new RTCSessionDescription(data.sdp);
        peer.setRemoteDescription(desc).catch(e => notifier.alert(e ,{labels : {alert : "RTC Failed"}}));
    }
    else if (data.authStatus == false) {
        notifier.alert('Authorization failed, please provide valid connection token',{labels : {alert : "Cannot Authorize"}});
        startbtn.classList.remove("hidden");
        document.getElementsByTagName("input")[0].style.display = "";

    }



}
