using System;
using UnityEngine;
using WebSocketSharp;

public class WebSocketClient : MonoBehaviour {
    /*
     * URL
     */
    [SerializeField] public string ip;
    [SerializeField] public string port;

    /*
     * WebSocket
     */
    public static WebSocketClient Instance;
    private WebSocket webSocket;

    /*
     * MESSAGE DATA TEMPLATE
     */

    public class MessageData {
        public int id;
        public int deltaTime;
        public string type;
        public string acceleration;
    }

    public class Data {
        public bool left;
        public bool right;
        public bool forward;
        public bool backward;
    }

    public string type;
    public bool left;
    public bool right;
    public bool forward;
    public bool backward;

    [SerializeField] public float trueX = 0;
    [SerializeField] public float trueY = 0;

    /*
     * TIME AND ID MANAGEMENT
     */
    private const int SAMPLING_INTERVAL = 200;
    private float timeLastMessage = 0f;
    private int messageId = 0;

    /*
     * CONNECT IMMEDIATELY ON AWAKE
     */
    private void Awake () {
        if (Instance == null)
            Instance = this;
        else
            Destroy (this);
        ip = PlayerPrefs.GetString ("ip");
        port = PlayerPrefs.GetString ("port");
        webSocket = new WebSocket ("wss://" + ip + ":" + port + "/stream");

        ConnectClient ();
    }

    /*
     * CONNECTING + ADDING LISTENERS
     */
    private void ConnectClient () {

        webSocket.OnOpen += OnOpen;
        webSocket.OnClose += OnClose;
        webSocket.OnError += OnError;
        webSocket.OnMessage += OnMessage;

        webSocket.Connect ();
    }

    /*
     * WS EVENT - ON ONPEN
     */
    private void OnOpen (object sender, EventArgs e) {
        trueX = 0F;
        trueY = 0F;
        // Debug.Log ("WebSocketClient: Connection opened");
    }

    /*
     * WS EVENT - ON ERROR
     */
    private void OnError (object sender, ErrorEventArgs e) {
        // Debug.Log ("WebSocketClient: ERROR: " + e.Message);
    }

    /*
     * WS EVENT - ON CLOSE
     */
    private void OnClose (object sender, CloseEventArgs e) {
        // Debug.Log ("WebSocketClient: Connection closed");

        trueX = 0F;
        trueY = 0F;
        webSocket.OnOpen -= OnOpen;
        webSocket.OnClose -= OnClose;
        webSocket.OnError -= OnError;
        webSocket.OnMessage -= OnMessage;

    }

    private void OnMessage (object sender, MessageEventArgs e) {
        JsonUtility.FromJsonOverwrite (e.Data, this);
        if (type == "web") {
            if ((left == true || right == true) && left != right) {
                if (left == true) {
                    if (trueX > -1F) { trueX = trueX - 0.1F; }
                } else {
                    if (trueX < 1F) { trueX = trueX + 0.1F; }
                }
            } else if (left == false && right == false) {
                if (trueX != 0) {
                    if (trueX < 0) {
                        trueX = trueX + 0.1F;
                    } else {
                        trueX = trueX - 0.1F;
                    }
                }
            }
            if (trueX > -0.1F && trueX < 0.1F && trueX != 0) {
                trueX = 0;
            }
            if ((backward == true || forward == true) && forward != right) {
                if (backward == true) {
                    if (trueY > -1F) { trueY = trueY - 0.2F; }
                } else {
                    if (trueY < 1F) { trueY = trueY + 0.2F; }
                }
            } else if (backward == false && forward == false) {
                if (trueY != 0) {
                    if (trueY < 0) {
                        trueY = trueY + 0.2F;
                    } else {
                        trueY = trueY - 0.2F;
                    }
                }
            }
            if (trueY > -0.1F && trueY < 0.1F && trueY != 0) {
                trueY = 0;
            }
            // Debug.Log ("x: " + trueX + " y: " + trueY);
        }
    }

    /*
     * SEND DATA ON UPDATE (SAMPLING_INTERVAL)
     */
    private void Update () {
        if (((Time.time * 1000) - timeLastMessage >= SAMPLING_INTERVAL) ||
            (timeLastMessage == 0)) {
            MessageData messageData = new MessageData ();
            messageData.id = messageId;
            messageData.type = "unity";
            messageData.deltaTime = SAMPLING_INTERVAL;
            messageData.acceleration = this.GetComponent<Rigidbody> ().velocity.magnitude.ToString ();

            string messageString = JsonUtility.ToJson (messageData);
            webSocket.Send (messageString);

            timeLastMessage = Time.time * 1000;
            messageId++;
        }
    }

    /*
     * CLOSE CONNECTION ON DESTROY
     */
    private void OnDestroy () {
        webSocket.Close ();
    }
}