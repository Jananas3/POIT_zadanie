//
//IP AND PORT
//
const IP_ADDRESS = window.location.hostname;
const WS_PORT = window.location.port;

//
//ACTION BUTTONS
//
const buttonStatus = {
  CONNECT: 0,
  START: 1,
  STOP: 2,
  DISCONNECT: 3,
};

var x = new Array();
var y = new Array();
var trace;
var layout;

var gauge = new RadialGauge({
  renderTo: "canvasID",
  width: 300,
  height: 300,
  units: "Km/h",
  minValue: 0,
  maxValue: 15,
  majorTicks: [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
    "13",
    "14",
    "15",
  ],
  minorTicks: 2,
  strokeTicks: true,
  highlights: [
    {
      from: 10,
      to: 15,
      color: "rgba(200, 50, 50, .75)",
    },
  ],
  colorPlate: "#fff",
  borderShadowWidth: 0,
  borders: false,
  needleType: "arrow",
  needleWidth: 2,
  needleCircleSize: 7,
  needleCircleOuter: true,
  needleCircleInner: false,
  animationDuration: 200,
  animationRule: "linear",
});
gauge.draw();
gauge.value = "0";

var connectionButton = document.getElementById("connection-btn");
var controlButton = document.getElementById("control-btn");

var forwardButton = document.getElementById("forward-btn");
var leftButton = document.getElementById("left-btn");
var rightButton = document.getElementById("right-btn");
var backwardButton = document.getElementById("backward-btn");

var logRadio = document.getElementById("logRadio");
var gaugeRadio = document.getElementById("gaugeRadio");
var graphRadio = document.getElementById("graphRadio");

var connectionButtonStatus = buttonStatus.CONNECT;
var controlButtonStatus = buttonStatus.START;

var message = { left: false, right: false, forward: false, backward: false };

//
//RADIOS
//
logRadio.onclick = function () {
  document.getElementById("console").style.display = "block";
  logRadio.checked = true;
  document.getElementById("gauge").style.display = "none";
  gaugeRadio.checked = false;
  document.getElementById("graph").style.display = "none";
  graphRadio.checked = false;
};

gaugeRadio.onclick = function () {
  document.getElementById("console").style.display = "none";
  logRadio.checked = false;
  document.getElementById("gauge").style.display = "block";
  gaugeRadio.checked = true;
  document.getElementById("graph").style.display = "none";
  graphRadio.checked = false;
};

graphRadio.onclick = function () {
  document.getElementById("console").style.display = "none";
  logRadio.checked = false;
  document.getElementById("gauge").style.display = "none";
  gaugeRadio.checked = false;
  document.getElementById("graph").style.display = "block";
  graphRadio.checked = true;
};

//
//CONNECTION
//
connectionButton.onclick = function () {
  if (connectionButtonStatus === buttonStatus.CONNECT) {
    serverConnect();
  } else if (connectionButtonStatus === buttonStatus.DISCONNECT) {
    serverDisconnect();
  }
};

//
//ENABLE BUTTONS
//
function enableAction(enableButtons) {
  for (var i = 0; i < enableButtons.length; i++) {
    enableButtons[i].classList.remove("disabled-btn");
    enableButtons[i].removeAttribute("disabled");
  }
}

//
//DISABLE BUTTONS
//
function disableAction(disableButtons) {
  for (var i = 0; i < disableButtons.length; i++) {
    disableButtons[i].classList.add("disabled-btn");
    disableButtons[i].setAttribute("disabled", "true");
  }
}

//
//CHANGE BUTTON STATUS
//
function changeButtonStatus(changeButton, oldButtonClass, newStatusString) {
  changeButton.innerHTML =
    newStatusString.charAt(0) + newStatusString.toLowerCase().slice(1);
  changeButton.classList.remove(oldButtonClass);
  changeButton.classList.add(newStatusString.toLowerCase() + "-btn");

  return buttonStatus[newStatusString];
}

//
//CHANGE CONTROL BUTTON STATUS
//
function changeControlButton(changeButton, oldButtonClass, newStatusString) {
  changeButton.classList.remove(oldButtonClass);
  changeButton.classList.add("control-btn" + newStatusString.toLowerCase());

  return buttonStatus[newStatusString];
}

//
//CONSOLE
//
var consoleView = document.getElementById("console-view");
var clearButton = document.getElementById("clear-btn");

//
//LOG TO CONSOLE
//
function consoleLog(messageType, messageText, isError = false) {
  if (!isError) {
    consoleView.innerHTML +=
      "<span>" + messageType + ": " + messageText + "</span><br>";
  } else {
    consoleView.innerHTML +=
      "<span class='error-message'>" +
      messageType +
      ": " +
      messageText +
      "</span><br>";
  }

  consoleView.scrollTop = consoleView.scrollHeight;
}

//
//CLEAR CONSOLE
//
function clearConsole() {
  consoleView.innerHTML = "";
  consoleView.scrollTop = consoleView.scrollHeight;
}

clearButton.onclick = clearConsole;

//
//ADJUST CONSOLE ACCORDING TO WINDOW
//
var consoleSection = document.getElementById("console");
var headingSection = document.getElementById("heading");
var actionsSection = document.getElementById("actions");
var resizeTimeot;

window.onresize = function () {
  this.clearTimeout(resizeTimeot);
  resizeTimeot = setTimeout(() => {
    consoleSection.style.maxHeight =
      window.innerHeight -
      headingSection.clientHeight -
      actionsSection.clientHeight +
      "px";
  }, 50);
};

consoleSection.style.maxHeight =
  window.innerHeight -
  headingSection.clientHeight -
  actionsSection.clientHeight +
  "px";

//
//CONTROL
//
var currentStream;
const SAMPLING_INTERVAL = 200;

controlButton.onclick = function () {
  if (controlButtonStatus === buttonStatus.START) {
    streamStart();
  } else if (controlButtonStatus === buttonStatus.STOP) {
    streamStop();
  }
};

//
//CONNECT TO SERVER
//
var webSocket;

function serverConnect() {
  disableAction([connectionButton]);

  consoleLog("CON", "Connecting...");
  wsLastState = WebSocket.CONNECTING;

  webSocket = new WebSocket("wss://" + IP_ADDRESS + ":" + WS_PORT + "/stream");

  webSocket.onopen = function () {
    wsLastState = WebSocket.OPEN;

    consoleLog("CON", "Connected");

    connectionButtonStatus = changeButtonStatus(
      connectionButton,
      "connect-btn",
      "DISCONNECT"
    );
    enableAction([connectionButton, controlButton]);
  };

  webSocket.oneror = function () {
    consoleLog("CON", "Connection failed", true);
  };
  webSocket.onclose = function () {
    switch (wsLastState) {
      case WebSocket.CLOSING:
        consoleLog("CON", "Disconnected");
        break;
      case WebSocket.CONNECTING:
        consoleLog("CON", "Unable to connect", true);
        break;
      case -1:
        consoleLog("CON", "Server occupied", true);
        break;
      default:
        consoleLog("CON", "Disconnected", true);
    }

    if (controlButton.disabled == false) {
      disableAction([controlButton]);
    }

    if (controlButtonStatus == buttonStatus.STOP) {
      streamStop();
    }

    if (connectionButtonStatus == buttonStatus.DISCONNECT) {
      connectionButtonStatus = changeButtonStatus(
        connectionButton,
        "disconnect-btn",
        "CONNECT"
      );
    }
    enableAction([connectionButton]);

    wsLastState = WebSocket.CLOSED;
  };
}

//
//DISCONNECT FROM SERVER
//
function serverDisconnect() {
  disableAction([connectionButton, controlButton]);

  consoleLog("CON", "Disconnecting...");
  wsLastState = WebSocket.CLOSING;

  webSocket.close();
}

window.onbeforeunload = serverDisconnect;

//
//START STREAMING
//
function streamStart() {
  disableAction([connectionButton]);
  enableAction([leftButton, rightButton, forwardButton, backwardButton]);
  consoleLog("OUT", "Stream started");
  webSocket.onmessage = function (evt) {
    var data = JSON.parse(evt.data);

    if (data.type === "unity") {
      if (logRadio.checked) {
        consoleLog("SPEED", data.acceleration);
      }
      if (gaugeRadio.checked) {
        gauge.value = data.acceleration;
      }
      if (graphRadio.checked) {
        x.push(parseFloat(data.id));
        y.push(parseFloat(data.acceleration));
        trace = {
          x: x,
          y: y,
        };

        layout = {
          title: "Speed",
          xaxis: {
            title: "id",
          },
          yaxis: {
            title: "speed",
          },
        };
        var traces = new Array();
        traces.push(trace);
        Plotly.newPlot($("#plotGraph")[0], traces, layout);
      }
    }
  };

  currentStream = setInterval(streamData, SAMPLING_INTERVAL);

  controlButtonStatus = changeButtonStatus(controlButton, "start-btn", "STOP");
}

//
//STREAM DATA
//
var dataId = 0;

function streamData() {
  let data = JSON.stringify({
    id: dataId,
    deltaTime: SAMPLING_INTERVAL,
    type: "web",
    forward: message.forward,
    left: message.left,
    backward: message.backward,
    right: message.right,
  });

  webSocket.send(data);
  dataId++;
}

//
//STOP STREAMING
//
function streamStop() {
  clearInterval(currentStream);
  dataId = 0;

  controlButtonStatus = changeButtonStatus(controlButton, "stop-btn", "START");
  changeControlButton(forwardButton, "control-btn", "");
  changeControlButton(leftButton, "control-btn", "");
  changeControlButton(rightButton, "control-btn", "");
  changeControlButton(backwardButton, "control-btn", "");

  enableAction([connectionButton]);
  disableAction([leftButton, rightButton, forwardButton, backwardButton]);

  consoleLog("OUT", "Stream stopped");
}

//
//CONTROL BUTTONS
//
document.onkeydown = function (e) {
  if (controlButtonStatus == buttonStatus.STOP) {
    if (e.which === 87) {
      changeControlButton(forwardButton, "control-btn", "-active");
      message.forward = true;
    }
    if (e.which === 65) {
      changeControlButton(leftButton, "control-btn", "-active");
      message.left = true;
    }
    if (e.which === 68) {
      changeControlButton(rightButton, "control-btn", "-active");
      message.right = true;
    }
    if (e.which === 83) {
      changeControlButton(backwardButton, "control-btn", "-active");
      message.backward = true;
    }
  }
};

document.onkeyup = function (e) {
  if (controlButtonStatus == buttonStatus.STOP) {
    console.log("TEST ", e.which);
    if (e.which === 87) {
      changeControlButton(forwardButton, "control-btn", "");
      message.forward = false;
    }
    if (e.which === 65) {
      changeControlButton(leftButton, "control-btn", "");
      message.left = false;
    }
    if (e.which === 68) {
      changeControlButton(rightButton, "control-btn", "");
      message.right = false;
    }
    if (e.which === 83) {
      changeControlButton(backwardButton, "control-btn", "");
      message.backward = false;
    }
  }
};
