import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  showSidebar = true;
  isSmallerScreen = false;

  constructor() {}

  ngOnInit(): void {
    this.initSizeVariables();
  }

  initSizeVariables() {
    if (window.screen.width < 1200) {
      this.showSidebar = false;
      this.isSmallerScreen = true;
    } else {
      this.showSidebar = true;
      this.isSmallerScreen = false;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.initSizeVariables();
  }

  showSidebarClick() {
    this.showSidebar = true;
  }

  hideSidebarClick() {
    this.showSidebar = false;
  }
}
