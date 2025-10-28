import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MembersComponent } from '../members/members.component';
import { MealsComponent } from '../meals/meals.component';
import { ExpensesComponent } from '../expenses/expenses.component';

@Component({
  selector: 'app-manage',
  standalone: true,
  imports: [CommonModule, MembersComponent, MealsComponent, ExpensesComponent],
  template: `
  <div class="container mt-3">
    <section id="members" class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h3 class="h5 m-0">Members</h3>
        <button class="btn btn-sm btn-outline-secondary" (click)="toggle('members')">{{ open() === 'members' ? 'Hide' : 'Show' }}</button>
      </div>
      <div *ngIf="open() === 'members'">
        <app-members [hideTitle]="true"></app-members>
      </div>
    </section>

    <section id="meals" class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h3 class="h5 m-0">Meals</h3>
        <button class="btn btn-sm btn-outline-secondary" (click)="toggle('meals')">{{ open() === 'meals' ? 'Hide' : 'Show' }}</button>
      </div>
      <div *ngIf="open() === 'meals'">
        <app-meals [hideTitle]="true"></app-meals>
      </div>
    </section>

    <section id="expenses" class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <h3 class="h5 m-0">Expenses</h3>
        <button class="btn btn-sm btn-outline-secondary" (click)="toggle('expenses')">{{ open() === 'expenses' ? 'Hide' : 'Show' }}</button>
      </div>
      <div *ngIf="open() === 'expenses'">
        <app-expenses [hideTitle]="true"></app-expenses>
      </div>
    </section>
  </div>
  `,
})
export class ManageComponent {
  // Track one open section at a time; null means all collapsed
  open = signal<null | 'members' | 'meals' | 'expenses'>('members');

  toggle(section: 'members' | 'meals' | 'expenses'){
    this.open.set(this.open() === section ? null : section);
  }
}
