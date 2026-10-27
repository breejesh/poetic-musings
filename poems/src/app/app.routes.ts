import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', title: 'Listen Now', loadComponent: () => import('./pages/home/home').then((m) => m.HomePage) },
  { path: 'browse', title: 'Browse', loadComponent: () => import('./pages/browse/browse').then((m) => m.BrowsePage) },
  { path: 'movements', redirectTo: 'browse' },
  {
    path: 'classics',
    title: 'Classics',
    data: { category: 'classic' },
    loadComponent: () => import('./pages/genre/genre').then((m) => m.GenrePage),
  },
  {
    path: 'contemporary',
    title: 'Contemporary',
    data: { category: 'contemporary' },
    loadComponent: () => import('./pages/genre/genre').then((m) => m.GenrePage),
  },
  {
    path: 'charts',
    title: 'Top 100',
    data: { kind: 'charts' },
    loadComponent: () => import('./pages/collection/collection').then((m) => m.CollectionPage),
  },
  {
    path: 'era/:slug',
    data: { kind: 'era' },
    loadComponent: () => import('./pages/collection/collection').then((m) => m.CollectionPage),
  },
  {
    path: 'movement/:slug',
    data: { kind: 'movement' },
    loadComponent: () => import('./pages/collection/collection').then((m) => m.CollectionPage),
  },
  { path: 'poets', title: 'Poets', loadComponent: () => import('./pages/poets/poets').then((m) => m.PoetsPage) },
  { path: 'poet/:slug', loadComponent: () => import('./pages/poet/poet').then((m) => m.PoetPage) },
  { path: 'poem/:slug', loadComponent: () => import('./pages/poem/poem').then((m) => m.PoemPage) },
  {
    path: 'favourites',
    title: 'Liked Poems',
    data: { tab: 'liked' },
    loadComponent: () => import('./pages/library/library').then((m) => m.LibraryPage),
  },
  {
    path: 'history',
    title: 'History',
    data: { tab: 'history' },
    loadComponent: () => import('./pages/library/library').then((m) => m.LibraryPage),
  },
  { path: 'search', title: 'Search', loadComponent: () => import('./pages/search/search').then((m) => m.SearchPage) },
  { path: '**', title: 'Lost in the margins', loadComponent: () => import('./pages/not-found/not-found').then((m) => m.NotFoundPage) },
];
