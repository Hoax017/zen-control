package com.zen.tvhelper;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.net.Uri;
import android.os.ParcelFileDescriptor;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Answers Zen Control over adb:
 *   content read --uri content://com.zen.tvhelper.apps/list          → JSON of every installed app
 *   content read --uri content://com.zen.tvhelper.apps/icon/<package> → PNG icon (banner if the app has one)
 */
public class AppsProvider extends ContentProvider {

    private static final int MATCH_ALL = PackageManager.MATCH_DISABLED_COMPONENTS
            | PackageManager.MATCH_DISABLED_UNTIL_USED_COMPONENTS;

    @Override
    public boolean onCreate() {
        return true;
    }

    @Override
    public ParcelFileDescriptor openFile(Uri uri, String mode) throws FileNotFoundException {
        List<String> seg = uri.getPathSegments();
        if (seg.isEmpty()) throw new FileNotFoundException(uri.toString());
        try {
            if (seg.get(0).equals("list")) return pipe(listJson().getBytes(StandardCharsets.UTF_8));
            if (seg.get(0).equals("icon") && seg.size() > 1) return pipe(iconPng(seg.get(1)));
        } catch (Exception e) {
            throw new FileNotFoundException(e.toString());
        }
        throw new FileNotFoundException(uri.toString());
    }

    private String listJson() throws Exception {
        PackageManager pm = getContext().getPackageManager();
        Set<String> leanback = new HashSet<>();
        for (ResolveInfo ri : pm.queryIntentActivities(
                new Intent(Intent.ACTION_MAIN).addCategory(Intent.CATEGORY_LEANBACK_LAUNCHER), MATCH_ALL)) {
            leanback.add(ri.activityInfo.packageName);
        }
        JSONArray out = new JSONArray();
        for (PackageInfo p : pm.getInstalledPackages(MATCH_ALL)) {
            ApplicationInfo ai = p.applicationInfo;
            JSONObject o = new JSONObject();
            o.put("package", p.packageName);
            o.put("label", ai.loadLabel(pm).toString());
            o.put("version", p.versionName == null ? "" : p.versionName);
            o.put("system", (ai.flags & ApplicationInfo.FLAG_SYSTEM) != 0);
            o.put("updatedSystem", (ai.flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0);
            o.put("launchable", leanback.contains(p.packageName));
            o.put("installed", p.firstInstallTime);
            o.put("updated", p.lastUpdateTime);
            out.put(o);
        }
        return out.toString();
    }

    private byte[] iconPng(String pkg) throws Exception {
        PackageManager pm = getContext().getPackageManager();
        ApplicationInfo ai = pm.getApplicationInfo(pkg, MATCH_ALL);
        Drawable d = ai.loadBanner(pm);
        if (d == null) d = ai.loadIcon(pm);
        Bitmap bmp;
        if (d instanceof BitmapDrawable && ((BitmapDrawable) d).getBitmap() != null) {
            bmp = ((BitmapDrawable) d).getBitmap();
        } else {
            int w = Math.max(1, Math.min(320, d.getIntrinsicWidth() > 0 ? d.getIntrinsicWidth() : 160));
            int h = Math.max(1, Math.min(320, d.getIntrinsicHeight() > 0 ? d.getIntrinsicHeight() : 160));
            bmp = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
            Canvas c = new Canvas(bmp);
            d.setBounds(0, 0, w, h);
            d.draw(c);
        }
        java.io.ByteArrayOutputStream bos = new java.io.ByteArrayOutputStream();
        bmp.compress(Bitmap.CompressFormat.PNG, 100, bos);
        return bos.toByteArray();
    }

    private ParcelFileDescriptor pipe(byte[] data) throws IOException {
        ParcelFileDescriptor[] p = ParcelFileDescriptor.createPipe();
        new Thread(() -> {
            try (OutputStream os = new ParcelFileDescriptor.AutoCloseOutputStream(p[1])) {
                os.write(data);
            } catch (IOException ignored) {
            }
        }).start();
        return p[0];
    }

    @Override
    public String getType(Uri uri) {
        return uri.getPathSegments().isEmpty() || !uri.getPathSegments().get(0).equals("icon")
                ? "application/json" : "image/png";
    }

    @Override
    public Cursor query(Uri uri, String[] projection, String selection, String[] args, String sort) {
        return null;
    }

    @Override
    public Uri insert(Uri uri, ContentValues values) {
        return null;
    }

    @Override
    public int delete(Uri uri, String selection, String[] args) {
        return 0;
    }

    @Override
    public int update(Uri uri, ContentValues values, String selection, String[] args) {
        return 0;
    }
}
