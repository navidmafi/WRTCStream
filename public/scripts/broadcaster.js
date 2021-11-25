// © Copyright Navid Mafi Ranji 2021 . <navidmafi2006@gmail.com> ALL RIGHT RESERVED


const startbtn = document.getElementById('start-stream');
const endbtn = document.getElementById('end-stream');
const connectionloader = document.getElementById('connectionloader');
const notifier = new AWN({position:"top-right"});

//TODO ROOM ID ON WINDOW.ONLOAD

function startBroadcast(form){

    startbtn.classList.add("hidden");
    connectionloader.classList.remove("hidden");
    form.getElementsByTagName("input")[0].style.filter = "blur(5px)"
    init({
        token : form.getElementsByTagName("input")[0].value
    },{
        audioOptions : {},
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
    console.log(stream);
    document.getElementById("video").srcObject = stream;
    connectionloader.classList.add("hidden");

    const peer = createPeer(clientOptions,mediaOptions);
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
}


function createPeer(clientOptions,mediaOptions) {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.easyvoip.com:3478"
            }
        ]
    });
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer,clientOptions,mediaOptions);
    return peer;
}

async function handleNegotiationNeededEvent(peer,clientOptions,mediaOptions) {
    const offer = await peer.createOffer();
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
        document.getElementsByTagName("input")[0].style.filter = ""

    }



}
