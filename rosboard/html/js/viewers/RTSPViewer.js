class RTSPViewer extends Viewer {
  onCreate() {
    this.viewerNode = $('<div></div>')
      .appendTo(this.card.content);

    this.video = $('<video autoplay playsinline controls></video>')
      .css({"width": "100%"})
      .appendTo(this.viewerNode);

    this.pc = null;

    super.onCreate();
  }

  async onData(msg) {
  if (msg._topic_name !== "/video/rtsp") return;
  console.log("[RTSPViewer] onData called with msg:", msg);

  if (this.pc) {
    console.log("[RTSPViewer] PeerConnection already exists, skipping.");
    return;
  }

  this.pc = new RTCPeerConnection();

  this.pc.addTransceiver("video", { direction: "recvonly" });

  const videoElement = this.video[0];

  this.pc.ontrack = function (event) {
  console.log("[RTSPViewer] Track received:", event.streams[0]);
  const stream = event.streams[0];

  console.log("[RTSPViewer] Incoming stream has tracks:", stream.getTracks());
  videoElement.srcObject = stream;

  setTimeout(() => {
    console.log("[RTSPViewer] Video element srcObject is:", videoElement.srcObject);
    console.log("[RTSPViewer] Video readyState:", videoElement.readyState);
  }, 2000);

  stream.getVideoTracks()[0]?.addEventListener('ended', () => {
    console.warn("[RTSPViewer] Video track ended.");
  });

  videoElement.play().then(() => {
    console.log("[RTSPViewer] Video playback started");
  }).catch(err => {
    console.warn("[RTSPViewer] Video playback failed:", err);
  });
};


  // Optional debug logs
  this.pc.onconnectionstatechange = () => {
    console.log("[RTSPViewer] Connection state:", this.pc.connectionState);
  };

  this.pc.oniceconnectionstatechange = () => {
    console.log("[RTSPViewer] ICE connection state:", this.pc.iceConnectionState);
  };

  try {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    console.log("[RTSPViewer] Created and set local offer");

    const ip = window.location.hostname;
    console.log('[RTSPViewer] Detected device IP/hostname:', ip);
    const response = await fetch(`http://${ip}:8080/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sdp: this.pc.localDescription.sdp,
        type: this.pc.localDescription.type
      })
    });

    const answer = await response.json();
    console.log("[RTSPViewer] Answer received from server");

    await this.pc.setRemoteDescription(answer);
    console.log("[RTSPViewer] Remote description set");
  } catch (error) {
    console.error("[RTSPViewer] Error during WebRTC setup:", error);
  }
}

}

RTSPViewer.friendlyName = "RTSP Stream";
RTSPViewer.supportedTypes = ["std_msgs/msg/Int32"];
RTSPViewer.maxUpdateRate = 24.0;

Viewer.registerViewer(RTSPViewer);
Viewer.defaultViewerForType["std_msgs/msg/Int32"] = RTSPViewer;