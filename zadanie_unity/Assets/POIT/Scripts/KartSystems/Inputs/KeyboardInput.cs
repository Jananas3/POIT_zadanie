using UnityEngine;

namespace KartGame.KartSystems {

    public class KeyboardInput : BaseInput {
        public string Horizontal = "Horizontal";
        public string Vertical = "Vertical";

        public override Vector2 GenerateInput () {
            //Debug.Log("x: "+GetComponent<WebSocketClient>().trueX+" y: "+GetComponent<WebSocketClient>().trueY);
            return new Vector2 {
                    x = GetComponent<WebSocketClient>().trueX,
                    y = GetComponent<WebSocketClient>().trueY
            };
        }
    }
}