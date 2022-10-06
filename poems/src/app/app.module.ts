import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { PoemContentComponent } from './components/poem-content/poem-content.component';
import { PoemComponent } from './pages/poem/poem.component';
import { PoemPlayerComponent } from './components/poem-player/poem-player.component';
import { NgxPopperModule } from 'ngx-popper';
import { PoemWidgetComponent } from './components/poem-widget/poem-widget.component';
import { UpNextComponent } from './components/up-next/up-next.component';

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    NavbarComponent,
    FooterComponent,
    PoemContentComponent,
    PoemComponent,
    PoemPlayerComponent,
    PoemWidgetComponent,
    UpNextComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxPopperModule.forRoot({
      placement: 'top',
      trigger: 'hover',
      applyClass: 'popper-dark',
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
