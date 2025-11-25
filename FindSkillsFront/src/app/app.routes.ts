import { Routes } from '@angular/router';
// import { HomePage } from './home-page/home-page';
// import { Register } from './accounts/register-page/register';
// import { Login } from './accounts/login-page/login';
// import { ProfileDiscoveryPage } from './profiles/profile-discovery-page/profile-discovery-page';
// import { ProfileDetailsPage } from './profiles/profile-details-page/profile-details-page';
// import { PostDiscoveryPage } from './posts/post-discovery-page/post-discovery-page';
// import { PostDetailsPage } from './posts/post-details-page/post-details-page';
// import { PostCreatePage } from './posts/post-create-page/post-create-page';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home-page/home-page').then(m => m.HomePage)
  },
  {
    path: 'register',
    loadComponent: () => import('./accounts/register-page/register').then(m => m.Register)
  },
  {
    path: 'login',
    loadComponent: () => import('./accounts/login-page/login').then(m => m.Login)
  },
  {
    path: 'profiles',
    loadComponent: () => import('./profiles/profile-discovery-page/profile-discovery-page').then(m => m.ProfileDiscoveryPage)
  },
  {
    path: 'profiles/:id/chat',
    loadComponent: () => import('./chats/chat-page/chat-page').then(m => m.ChatPage)
  },
  {
    path: 'my-chats',
    loadComponent: () => import('./chats/chat-list-page/chat-list-page').then(m => m.ChatListPage)
  },
  {
    path: "profiles/:id",
    loadComponent: () => import('./profiles/profile-details-page/profile-details-page').then(m => m.ProfileDetailsPage)
  },
  {
    path: 'posts/:type',
    loadComponent: () => import('./posts/post-discovery-page/post-discovery-page').then(m => m.PostDiscoveryPage)
  },
  {
    path: 'posts/:type/create',
    loadComponent: () => import('./posts/post-create-page/post-create-page').then(m => m.PostCreatePage)
  },
  {
    path: "posts/:type/:id",
    loadComponent: () => import('./posts/post-details-page/post-details-page').then(m => m.PostDetailsPage)
  },
];
