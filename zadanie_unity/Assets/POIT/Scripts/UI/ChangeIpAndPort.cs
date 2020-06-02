using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public class ChangeIpAndPort : MonoBehaviour {
    public string newText;
    public GameObject inputField;

    public void ChangeInputField () {
        newText = inputField.GetComponent<Text> ().text;
        string[] split = newText.Split (':');
        if (split.Length == 2) {
            PlayerPrefs.SetString ("ip", split[0]);
            PlayerPrefs.GetString ("port", split[1]);
        }
    }
}