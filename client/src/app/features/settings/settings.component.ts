import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Device } from '@capacitor/device';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings">
      <h2>Settings</h2>
      <div class="field">
        <label>API Base URL</label>
        <input [(ngModel)]="apiBaseUrl" placeholder="http://10.0.2.2:4001/api" />
        <small>
          Examples:
          <ul>
            <li>Emulator → http://10.0.2.2:4001/api</li>
            <li>Device on LAN → http://YOUR_PC_LAN_IP:4001/api</li>
          </ul>
        </small>
      </div>

      <button (click)="save()">Save</button>
      <button (click)="reset()" class="secondary">Reset to default</button>
      <button (click)="autoDetect()" class="secondary">Auto-detect for Android</button>
      <button (click)="useLocalhost()" class="secondary">Use localhost (web)</button>
      <button (click)="testConnection()">Test connection</button>

      <p class="note">This is stored locally only and can be changed anytime.</p>
      <p *ngIf="testStatus" [style.color]="testStatusColor">{{ testStatus }}</p>
    </div>
  `,
  styles: [
    `
    .settings { max-width: 640px; margin: 1rem auto; padding: 1rem; }
    .field { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1rem; }
    input { padding: .5rem; }
    button { margin-right: .5rem; }
    small { color: #666; }
    .note { margin-top: 1rem; color: #666; }
    `,
  ],
})
export class SettingsComponent {
  private api = inject(ApiService);
  apiBaseUrl = localStorage.getItem('mm.apiBase') || this.api.apiBase;
  testStatus: string | null = null;
  testStatusColor = '#666';

  save() {
    const url = (this.apiBaseUrl || '').trim();
    if (!url) return;
    localStorage.setItem('mm.apiBase', url);
    this.api.setApiBase(url);
    alert('Saved. API base set to ' + url);
  }

  reset() {
    localStorage.removeItem('mm.apiBase');
    // resetting will set ApiService base back to environment default on reload
    alert('Reset. Reload app to use default environment API base.');
  }

  async autoDetect() {
    try {
      const info = await Device.getInfo();
      // On Android emulator, host machine is reachable at 10.0.2.2
      if (info.platform === 'android') {
        // Heuristic: use emulator IP; for physical device, suggest entering LAN IP
        if (info.isVirtual) {
          this.apiBaseUrl = 'http://localhost:4001/api';
          this.save();
        } else {
          const ip = prompt('Enter your PC LAN IP (e.g., 192.168.1.100):', '');
          if (ip) {
            this.apiBaseUrl = `http://${ip}:4001/api`;
            this.save();
          }
        }
      } else {
        alert('Auto-detect is tailored for Android. For web/others, set URL manually.');
      }
    } catch (e) {
      console.error(e);
      alert('Could not auto-detect. Please set the API URL manually.');
    }
  }

  useLocalhost() {
    this.apiBaseUrl = 'http://localhost:4001/api';
    this.save();
  }

  testConnection() {
    this.testStatus = 'Testing...';
    this.testStatusColor = '#666';
    this.api.health().subscribe({
      next: (res: any) => {
        this.testStatus = 'Success: ' + (typeof res === 'string' ? res : 'OK');
        this.testStatusColor = 'green';
      },
      error: (err) => {
        console.error(err);
        this.testStatus = 'Failed: ' + (err?.message || 'Unknown error');
        this.testStatusColor = 'red';
      }
    });
  }
}
