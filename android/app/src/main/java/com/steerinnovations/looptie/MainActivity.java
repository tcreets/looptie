package com.steerinnovations.looptie;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeArticleReaderPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
