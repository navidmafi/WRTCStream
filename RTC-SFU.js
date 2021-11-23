const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const webrtc = require("wrtc");

//let audioBandwidth = 50;
//let videoBandwidth = 8000;
let senderStream;
let peerOptions;
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/consumer", async ({ body }, res) => {
    
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.easyvoip.com:3478"
            }
        ]
    });
    const desc = new webrtc.RTCSessionDescription(setBandwidth(body.sdp,peerOptions.bitrate));
    await peer.setRemoteDescription(desc);
    senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }
    //console.log(body.sdp);

    res.json(payload);
});

app.post('/broadcast', async ({ body }, res) => {
    console.log(body);
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    peer.ontrack = (e) => handleTrackEvent(e, peer);
    peerOptions = body.peerOptions;
    const desc = new webrtc.RTCSessionDescription(setBandwidth(body.sdp,peerOptions.bitrate));
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }
    console.log(body);

    res.json(payload);
});

function handleTrackEvent(e, peer) {
    senderStream = e.streams[0];
};
function setBandwidth(sdp,bandwidth) {
    //sdp.sdp = sdp.sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:' + audioBandwidth + '\r\n');
    sdp.sdp = sdp.sdp.replace(/a=mid:0\r\n/g, 'a=mid:0\r\nb=AS:' + bandwidth + '\r\n');
    console.log(sdp.sdp);
    return sdp;
}

app.listen(5000, () => console.log('server started'));