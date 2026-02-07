import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Package, Layers, FileText, ShoppingCart, Users, Tag, Settings, LayoutDashboard, FolderTree } from 'lucide-react';

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/produits', icon: Package, label: 'Produits' },
  { to: '/admin/categories', icon: FolderTree, label: 'Catégories' },
  { to: '/admin/collections', icon: Layers, label: 'Collections' },
  { to: '/admin/commandes', icon: ShoppingCart, label: 'Commandes' },
  { to: '/admin/articles', icon: FileText, label: 'Articles' },
  { to: '/admin/clients', icon: Users, label: 'Clients' },
  { to: '/admin/promos', icon: Tag, label: 'Promos' },
  { to: '/admin/reglages', icon: Settings, label: 'Réglages' },
];

const AdminLayout = () => {
  const location = useLocation();

  return (
    <>
    <Header />
    <div className="pt-16 md:pt-20 min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border bg-sidebar-background hidden md:block fixed top-16 md:top-20 bottom-0 overflow-y-auto">
        <nav className="p-4 space-y-1">
          {navItems.map(item => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 text-xs tracking-[0.1em] uppercase font-body transition-colors ${
                  active
                    ? 'bg-sidebar-accent text-sidebar-primary font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                }`}
              >
                <item.icon size={15} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile nav */}
      <div className="md:hidden fixed top-16 left-0 right-0 z-40 border-b border-border bg-background overflow-x-auto">
        <div className="flex px-4 py-2 gap-1">
          {navItems.map(item => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] tracking-wider uppercase font-body whitespace-nowrap transition-colors ${
                  active ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon size={12} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-56 p-6 md:p-8 mt-10 md:mt-0">
        <Outlet />
      </main>
    </div>
    </>
  );
};

export default AdminLayout;
