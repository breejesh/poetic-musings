import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent } from './pages/landing/landing.component';
import { PoemComponent } from './pages/poem/poem.component';

const routes: Routes = [
  { path: ':page', component: LandingComponent },
  { path: 'poem/:id', component: PoemComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
