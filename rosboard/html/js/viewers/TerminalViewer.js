class TerminalViewer extends Viewer {
  onCreate() {
    this.termStarted = false;

    this.viewerNode = $('<div></div>')
      .css({
        "height": "500px",
        "width": "100%",
        "background": "#212121",
        "overflow": "hidden"
      })
      .appendTo(this.card.content);

    super.onCreate();
  }

  async onData(msg) {
    if (msg._topic_name !== "/shell_trigger") return;

    if (!this.termStarted) {
      this.termStarted = true;
      this.startTerminal();
    }
  }

  startTerminal() {
    this.term = new Terminal();
    this.fitAddon = new FitAddon.FitAddon();
    this.term.loadAddon(this.fitAddon);
    this.term.open(this.viewerNode[0]);
    this.fitAddon.fit();

    const wsProto = location.protocol === "https:" ? "wss://" : "ws://";
    this.ws = new WebSocket(wsProto + window.location.hostname+ ":8000/ws");

    this.term.onData(data => {
      this.ws.send(data);
    });

    this.ws.onmessage = ev => {
      this.term.write(ev.data);
    };

    const resizeTerm = () => {
      this.fitAddon.fit();
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send("!resize:" + this.term.cols + ":" + this.term.rows);
      }
    };

    window.addEventListener("resize", resizeTerm);
    this.term.onResize(resizeTerm);
    setTimeout(resizeTerm, 200);
  }
}

TerminalViewer.friendlyName = "Terminal Shell";
TerminalViewer.supportedTypes = ["std_msgs/msg/Empty"];
TerminalViewer.maxUpdateRate = 1.0;

Viewer.registerViewer(TerminalViewer);
Viewer.defaultViewerForType["std_msgs/msg/Empty"] = TerminalViewer;
