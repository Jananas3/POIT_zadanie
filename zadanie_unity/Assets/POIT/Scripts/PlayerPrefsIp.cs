using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class PlayerPrefsIp : MonoBehaviour
{
    void Start()
    {
            PlayerPrefs.SetString("ip","192.168.0.94");
            PlayerPrefs.SetString("port","8080");
    }
}
