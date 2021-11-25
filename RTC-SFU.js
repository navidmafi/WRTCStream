const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const webrtc = require("wrtc");
const allowedClients = ["kobs","choobs"]
let senderStream;
let mediaOptions;
let clientOptions;
let isBroadcasting = false;
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/consumer", async ({ body }, res) => {
    if (isBroadcasting) {
        const peer = new webrtc.RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.easyvoip.com:3478"
                }
            ]
        });
        const desc = new webrtc.RTCSessionDescription(setBandwidth(body.sdp,mediaOptions.videoOptions.videoBitrate));
        await peer.setRemoteDescription(desc);
        senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            sdp: peer.localDescription
        }
        //console.log(body.sdp);

        res.json(payload);
    }
    else {
        const payload = {
            isBroadcasting,
        }
        //console.log(body.sdp);

        res.json(payload);
    }


});

app.post('/broadcast', async ({ body }, res) => {
    mediaOptions = body.mediaOptions;
    clientOptions = body.clientOptions;
   if (allowedClients.includes(clientOptions.token)) {
       outputLog('AUTH','Auth succeeded')
       const peer = new webrtc.RTCPeerConnection({
           iceServers: [
               {
                   urls: "stun:stun.stunprotocol.org"
               }
           ]
       });
       peer.ontrack = (e) => handleTrackEvent(e, peer);

       const desc = new webrtc.RTCSessionDescription(setBandwidth(body.sdp,mediaOptions.videoOptions.videoBitrate));
       await peer.setRemoteDescription(desc);
       const answer = await peer.createAnswer();
       await peer.setLocalDescription(answer);
       const payload = {
           authStatus : "success",
           sdp: peer.localDescription
       }

       res.json(payload);
   }
   else {
       outputLog('AUTH','Auth failed with token : ' + clientOptions.token)
       const payload = {
           authStatus : "failed"
       }

       res.json(payload);
   }
});

function handleTrackEvent(e, peer) {
    senderStream = e.streams[0];
    outputLog('status', 'Set senderStream OK')
    isBroadcasting = true;
};
function setBandwidth(sdp,bandwidth) {
    //sdp.sdp = sdp.sdp.replace(/a=mid:audio\r\n/g, 'a=mid:audio\r\nb=AS:' + audioBandwidth + '\r\n');
    sdp.sdp = sdp.sdp.replace(/a=mid:0\r\n/g, 'a=mid:0\r\nb=AS:' + bandwidth + '\r\n');

    return sdp;
}
function outputLog(type,text) {
    let time = new Date();
    let ftext = time.toLocaleTimeString() + ' ['+ type.toUpperCase() + '] : '+text;
    console.log(ftext);
}
app.listen(5000, () => outputLog('status','Server Startup'));