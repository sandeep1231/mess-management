import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Expense, Meal, Member, Mess, SummaryResult } from './types';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = this.computeApiBase();
  constructor(private http: HttpClient) {}

  private computeApiBase(){
    const saved = localStorage.getItem('mm.apiBase');
    const def = environment.apiBase;
    // Detect Capacitor/native environment
    const isNative = typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.() === true;
    // Use full Render URL for native apps
    const nativeApiBase = 'https://mess-management-ttus.onrender.com/api';
    // if (isNative) {
      return nativeApiBase;
    // }
    // In production on Render (or any host), avoid using a saved localhost/127.* override or a different origin.
    // if (environment.production) {
    //   try {
    //     if (saved) {
    //       const u = new URL(saved, window.location.origin);
    //       const isLocal = /^(localhost|127\.|10\.|192\.168\.)/.test(u.hostname);
    //       const differentOrigin = u.origin !== window.location.origin && saved.startsWith('http');
    //       if (isLocal || differentOrigin) {
    //         localStorage.removeItem('mm.apiBase');
    //         return def; // typically '/api'
    //       }
    //     }
    //   } catch {
    //     // On parse error, fall back to default and clear
    //     localStorage.removeItem('mm.apiBase');
    //     return def;
    //   }
    // }
    // return saved || def;
  }

  setApiBase(url: string){
    this.base = url;
    localStorage.setItem('mm.apiBase', url);
  }

  get apiBase() {
    return this.base;
  }

  private get rootBase() {
    // Strip trailing /api to reach server root for /health
    return this.base.replace(/\/api\/?$/, '');
  }

  // Public root accessor for auth endpoints
  get apiRoot() {
    return this.rootBase;
  }

  // Health check (returns raw text or JSON depending on server)
  health() {
    return this.http.get(`${this.rootBase}/health`, { responseType: 'text' as 'json' });
  }

  // Auth
  register(phone: string, password: string, role?: 'admin'|'user') {
    return this.http.post<{ token?: string; role?: 'admin' | 'user'; approved: boolean }>(`${this.apiRoot}/auth/register`, { phone, password, role });
  }
  login(phone: string, password: string) {
    return this.http.post<{ token: string; role: 'admin' | 'user' }>(`${this.apiRoot}/auth/login`, { phone, password });
  }
  getMe() { return this.http.get<{ id: string; phone: string; role: 'admin' | 'user' }>(`${this.apiRoot}/auth/me`); }
  myMembers(){ return this.http.get<Array<{ _id: string; messId: string; name: string; phone?: string; active: boolean }>>(`${this.apiRoot}/auth/my-members`); }
  isFirstUser(){ return this.http.get<{ firstUser: boolean }>(`${this.apiRoot}/auth/first-user`); }
  setUserRole(id: string, role: 'admin'|'user') { return this.http.post(`${this.apiRoot}/auth/role/${id}`, { role }); }
  // Admin
  listUsers(){ return this.http.get<any[]>(`${this.apiRoot}/auth/users`); }
  approveUser(id: string){ return this.http.post<any>(`${this.apiRoot}/auth/approve/${id}`, {}); }
  updateUser(id: string, patch: { phone?: string; approved?: boolean }){ return this.http.put<any>(`${this.apiRoot}/auth/users/${id}`, patch); }
  deleteUser(id: string){ return this.http.delete<void>(`${this.apiRoot}/auth/users/${id}`); }

  // Updates
  updateMeal(id: string, patch: Partial<Pick<Meal, 'date' | 'lunch' | 'dinner'>>) {
    return this.http.patch<Meal>(`${this.base}/meals/${id}`, patch);
  }
  updateExpense(id: string, patch: Partial<Pick<Expense, 'date' | 'amount' | 'category' | 'note' | 'payerMemberId'>>) {
    return this.http.patch<Expense>(`${this.base}/expenses/${id}`, patch);
  }

  // Messes
  createMess(name: string) { return this.http.post<Mess>(`${this.base}/messes`, { name }); }
  getMess(id: string) { return this.http.get<Mess>(`${this.base}/messes/${id}`); }
  getSummary(id: string, month: string) { return this.http.get<SummaryResult>(`${this.base}/messes/${id}/summary`, { params: { month } }); }
  searchMesses(q: string){ return this.http.get<Mess[]>(`${this.base}/messes`, { params: { q } }); }

  // Members
  listMembers(messId: string) { return this.http.get<Member[]>(`${this.base}/members`, { params: { messId } }); }
  addMember(messId: string, name: string) { return this.http.post<Member>(`${this.base}/members`, { messId, name }); }
  addMemberWithPhone(messId: string, name: string, phone: string) { return this.http.post<Member>(`${this.base}/members`, { messId, name, phone }); }
  updateMember(id: string, patch: Partial<Pick<Member, 'name' | 'active' | 'phone'>>) { return this.http.patch<Member>(`${this.base}/members/${id}`, patch); }
  searchMembers(messId: string, q: string){ return this.http.get<Member[]>(`${this.base}/members/search`, { params: { messId, q } }); }
  deleteMember(id: string) { return this.http.delete<void>(`${this.base}/members/${id}`); }

  // Meals
  addMeal(input: Omit<Meal, '_id'>) { return this.http.post<Meal>(`${this.base}/meals`, input); }
  addMyMeal(messId: string, date: string, payload: { lunch?: boolean; dinner?: boolean }) {
    return this.http.post<Meal>(`${this.base}/meals/self`, { messId, date, ...payload });
  }
  listMeals(messId: string, month?: string, memberId?: string) {
    const params: any = { messId }; if (month) params.month = month; if (memberId) params.memberId = memberId;
    return this.http.get<Meal[]>(`${this.base}/meals`, { params });
  }
  // Attendance (bulk upsert for a date)
  saveAttendance(messId: string, date: string, items: Array<{ memberId: string; lunch?: boolean; dinner?: boolean }>) {
    return this.http.post<Meal[]>(`${this.base}/meals/attendance`, { messId, date, items });
  }
  deleteMeal(id: string) { return this.http.delete<void>(`${this.base}/meals/${id}`); }

  // Expenses
  addExpense(input: Omit<Expense, '_id'>) { return this.http.post<Expense>(`${this.base}/expenses`, input); }
  addMyExpense(messId: string, date: string, amount: number, category?: string, note?: string) {
    return this.http.post<Expense>(`${this.base}/expenses/self`, { messId, date, amount, category, note });
  }
  listExpenses(messId: string, month?: string, memberId?: string) {
    const params: any = { messId }; if (month) params.month = month; if (memberId) params.memberId = memberId;
    return this.http.get<Expense[]>(`${this.base}/expenses`, { params });
  }
  deleteExpense(id: string) { return this.http.delete<void>(`${this.base}/expenses/${id}`); }
}
