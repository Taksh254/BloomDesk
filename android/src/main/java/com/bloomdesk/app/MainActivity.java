package com.bloomdesk.app;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.text.InputType;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;

/** Opens the hosted BloomDesk web app full screen. */
public class MainActivity extends Activity {
    private WebView web;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        web.setFitsSystemWindows(true); // keep pages clear of the status bar on Android 15's edge-to-edge
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        web.setWebViewClient(new WebViewClient() {
            // Pages on the BloomDesk host stay in the app; anything else (WhatsApp, tel:, other sites) opens outside it.
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                Uri target = Uri.parse(url);
                Uri home = Uri.parse(appUrl());
                if (target.getHost() != null && target.getHost().equals(home.getHost())) return false;
                startActivity(new Intent(Intent.ACTION_VIEW, target));
                return true;
            }
        });
        setContentView(web);

        if (state != null) web.restoreState(state);
        else if (appUrl().isEmpty()) askForUrl();
        else web.loadUrl(appUrl());
    }

    private String appUrl() {
        if (!BuildConfig.APP_URL.isEmpty()) return BuildConfig.APP_URL;
        return getPreferences(MODE_PRIVATE).getString("url", "");
    }

    /** Only when the APK was built without -PbloomdeskUrl. Clear the app's data to change the address. */
    private void askForUrl() {
        EditText input = new EditText(this);
        input.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        input.setHint("http://192.168.1.10:3000");
        new AlertDialog.Builder(this)
                .setTitle("Where is BloomDesk running?")
                .setView(input)
                .setCancelable(false)
                .setPositiveButton("Open", new DialogInterface.OnClickListener() {
                    @Override
                    public void onClick(DialogInterface d, int w) {
                        String url = input.getText().toString().trim();
                        if (!url.contains("://")) url = "http://" + url;
                        getPreferences(MODE_PRIVATE).edit().putString("url", url).apply();
                        web.loadUrl(url);
                    }
                })
                .show();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }
}
