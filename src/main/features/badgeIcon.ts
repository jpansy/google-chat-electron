import { ipcMain, app, nativeImage, BrowserWindow, Tray } from 'electron';
import path from 'path';
import { is } from "electron-util";
import store from '../config';
import fs from 'fs';
import { spawn } from 'child_process';

type IconTypes = 'offline' | 'normal' | 'badge';
let lastCount: number = -1;
const scriptPath = path.join(app.getPath('appData'), 'google-chat-electron', 'on-message.sh');

// Decide app icon based on favicon URL
const decideIcon = (href: string): IconTypes => {
  let type: IconTypes = 'offline';

  if (href.match(/favicon_chat_r3/) ||
    href.match(/favicon_chat_new_non_notif_r3/)) {
    type = 'normal';
  } else if (href.match(/favicon_chat_new_notif_r3/)) {
    type = 'badge';
  }

  return type;
}

export default (window: BrowserWindow, trayIcon: Tray) => {

  ipcMain.on('faviconChanged', (evt, href) => {
    const type = decideIcon(String(href));

    // Unread indicator for tray icon
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
    // TODO: Unread count is currently not working and function never called

    app.setBadgeCount(Number(count))

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
