import { ipcMain, app, nativeImage, BrowserWindow, Tray } from 'electron';
import path from 'path';
import { is } from "electron-util";
import log from 'electron-log';
import store from '../config';
import fs from 'fs';
import { spawn } from 'child_process';

type IconTypes = 'offline' | 'normal' | 'badge';
let lastCount: number = -1;
const scriptPath = path.join(app.getPath('appData'), 'google-chat-electron', 'on-message.sh');

// Decide app icon based on favicon URL.
// Google Chat has shipped two favicon schemes; we match both.
//   Legacy (gstatic ui/v1/icons/mail/...):
//     favicon_chat_r*                  -> normal (no unread)
//     favicon_chat_new_non_notif*      -> normal (read state)
//     favicon_chat_new_notif*          -> badge  (unread)
//   Chat 2026 (gstatic dynamite/images/favicons_*/...):
//     chat_2026_logo_favicon_no_dot_*  -> normal (no unread)
//     chat_2026_logo_favicon_dot_*     -> badge  (unread)
const decideIcon = (href: string): IconTypes => {
  if (href.match(/chat_2026_logo_favicon_dot/) ||
      href.match(/favicon_chat_new_notif/)) {
    return 'badge';
  }

  if (href.match(/chat_2026_logo_favicon_no_dot/) ||
      href.match(/favicon_chat_r/) ||
      href.match(/favicon_chat_new_non_notif/)) {
    return 'normal';
  }

  return 'offline';
}

export default (window: BrowserWindow, trayIcon: Tray) => {

  ipcMain.on('faviconChanged', (evt, href) => {
    const type = decideIcon(String(href));

    log.info(`[favicon] href="${href}" -> type=${type}`);
    console.log(`faviconChanged: ${type}`);
    const size = is.macos ? 16 : 32;
    const icon = nativeImage.createFromPath(path.join(app.getAppPath(), `resources/icons/${type}/${size}.png`))
    trayIcon.setImage(icon);

    // Unread indicator for dock icon (on mac/linux)     
    if (type == 'badge') {
        app.setBadgeCount();
    } else if (type == 'normal') {
        app.setBadgeCount(0);
    }    
  });

  ipcMain.on('unreadCount', (event, count: number) => {
    // TODO: Unread count is currently not working and function never called therefore deactivated and replaced with unread indicator
    
    // app.setBadgeCount(Number(count))

    if (store.get('app.showOnMessage')) {
      if (count > 0) {
        window.showInactive();
      }
    }

    if (is.linux) {
      if (count > 0 && lastCount != count) {
        if (fs.existsSync(scriptPath)) {
          spawn(scriptPath);
        }
      }
    }
    
    lastCount = count;
  });
}
