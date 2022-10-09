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
    if (window.innerWidth <= 1280) {
      this.showSidebar = false;
      this.isSmallerScreen = true;
    } else {
      this.showSidebar = true;
      this.isSmallerScreen = false;
    }
    console.log('showSidebar', this.showSidebar);
    console.log('isSmallerScreen', this.isSmallerScreen);
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
