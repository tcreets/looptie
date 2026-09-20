package com.steerinnovations.looptie;

import android.graphics.Color;
import android.view.ViewGroup;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeArticleReader")
public class NativeArticleReaderPlugin extends Plugin {
    private WebView articleView;

    @PluginMethod
    public void mount(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.isEmpty()) {
            call.reject("Article URL is required");
            return;
        }

        getActivity().runOnUiThread(() -> {
            removeReader();
            articleView = new WebView(getContext());
            articleView.setBackgroundColor(Color.WHITE);
            articleView.setWebViewClient(new WebViewClient());
            WebSettings settings = articleView.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setLoadWithOverviewMode(true);
            settings.setUseWideViewPort(true);

            FrameLayout root = getActivity().findViewById(android.R.id.content);
            root.addView(articleView, buildLayout(call));
            articleView.setX(toPx(call.getDouble("x", 0.0), call));
            articleView.setY(toPx(call.getDouble("y", 0.0), call));
            articleView.loadUrl(url);
            call.resolve();
        });
    }

    @PluginMethod
    public void updateFrame(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            if (articleView != null) {
                articleView.setLayoutParams(buildLayout(call));
                articleView.setX(toPx(call.getDouble("x", 0.0), call));
                articleView.setY(toPx(call.getDouble("y", 0.0), call));
            }
            call.resolve();
        });
    }

    @PluginMethod
    public void unmount(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            removeReader();
            call.resolve();
        });
    }

    private FrameLayout.LayoutParams buildLayout(PluginCall call) {
        double scale = call.getDouble("scale", 1.0);
        int width = Math.max(1, (int) Math.round(call.getDouble("width", 1.0) * scale));
        int height = Math.max(1, (int) Math.round(call.getDouble("height", 1.0) * scale));
        return new FrameLayout.LayoutParams(width, height);
    }

    private float toPx(double cssPixels, PluginCall call) {
        return (float) (cssPixels * call.getDouble("scale", 1.0));
    }

    private void removeReader() {
        if (articleView != null) {
            ViewGroup parent = (ViewGroup) articleView.getParent();
            if (parent != null) parent.removeView(articleView);
            articleView.stopLoading();
            articleView.destroy();
            articleView = null;
        }
    }
}
