"use client"
import React, { useState, useEffect } from 'react';
import { Inbox, Menu, X, ChevronRight, Pill, FileText, LogOut } from "lucide-react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";

interface CustomSidebarProps {
  children: React.ReactNode;
  className?: string;
}

const CustomSidebar: React.FC<CustomSidebarProps> = ({ children, className }) => (
  <aside className={`${className} transition-all duration-300 ease-in-out`}>
    {children}
    <style jsx>{`
      aside {
        animation: slideIn 0.3s ease forwards;
      }
      
      @keyframes slideIn {
        from { transform: translateX(-20px); opacity: 0.8; }
        to { transform: translateX(0); opacity: 1; }
      }
    `}</style>
  </aside>
);

interface MenuGroupProps {
  label?: string;
  children: React.ReactNode;
}

const MenuGroup: React.FC<MenuGroupProps> = ({ label, children }) => (
  <div className="mb-6">
    {label && <h3 className="text-gray-400 text-xs uppercase tracking-wider px-4 mb-2 font-semibold">{label}</h3>}
    <div>{children}</div>
  </div>
);

interface MenuItemProps {
  icon: React.ElementType;
  title: string;
  url: string;
  isActive: boolean;
  onClick: (id: string, url: string) => void;
  id: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon: Icon, title, url, isActive, onClick, id }) => (
  <li className="mb-2 px-2">
    <a
      href="#"
      className={`flex items-center justify-start w-full p-3 rounded-lg transition-all duration-300 ${
        isActive
          ? 'bg-gradient-to-r from-blue-600 to-indigo-500 text-white shadow-md'
          : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
      }`}
      onClick={(e) => {
        e.preventDefault();
        onClick(id, url);
      }}
    >
      <div className={`relative ${isActive ? 'mr-3' : 'mr-3'}`}>
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`} />
        {isActive && (
          <span className="absolute -inset-1 rounded-full bg-blue-400/20 pulse-animation"></span>
        )}
      </div>
      <span className="whitespace-nowrap font-medium">{title}</span>
      {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
    </a>
    <style jsx>{`
      li {
        transition: transform 0.2s ease;
      }
      
      li:hover {
        transform: scale(1.02);
      }
      
      li:active {
        transform: scale(0.98);
      }
      
      .pulse-animation {
        animation: pulse 2s infinite;
      }
      
      @keyframes pulse {
        0% { opacity: 0.2; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(1.2); }
        100% { opacity: 0.2; transform: scale(1); }
      }
    `}</style>
  </li>
);

interface MenuItem {
  id: string;
  title: string;
  url: string;
  icon: React.ElementType;
}

export function AppSidebar({ children }: { children?: React.ReactNode }): React.ReactElement {
  const router = useRouter();
  const [activeItem, setActiveItem] = useState<string>("patient-management");
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [animateItems, setAnimateItems] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    const checkViewport = (): void => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      }
    };

    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          router.push('/');
          return;
        }
        
        if (session.user?.email) {
          setUserEmail(session.user.email);
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/login');
      }
    };

    checkAuth();
    checkViewport();
    window.addEventListener('resize', checkViewport);
    
    setTimeout(() => setAnimateItems(true), 100);
    
    return () => window.removeEventListener('resize', checkViewport);
  }, [router]);

  const items: MenuItem[] = [
    { id: "patient-management", title: "Patient Management", url: "/admin/patients", icon: Inbox },
    { id: "medicine-management", title: "Medicine Management", url: "/admin/medicines", icon: Pill },
    { id: "generate-prescription", title: "Generate Prescription", url: "/admin/prescription", icon: FileText },
  ];

  const handleItemClick = async (id: string, url: string): Promise<void> => {
    try {
      // Set active item
      setActiveItem(id);
      
      // Use router.push with proper error handling
      await router.push(url);
      
      // Close sidebar on mobile after navigation
      if (isMobile) {
        setIsExpanded(false);
      }
    } catch (error: unknown) {
      console.error('Error during navigation:', error);
      // Fallback to window.location if there's an error
      window.location.href = url;
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const toggleSidebar = (): void => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
          style={{animation: 'fadeIn 0.3s ease forwards'}}
        />
      )}

      <CustomSidebar
        className={`
          bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900
          border-r border-gray-800/50 text-white
          flex flex-col
          ${isExpanded ? 'w-64' : 'w-20'} 
          ${isMobile ? 'fixed z-30 h-full' : 'relative'}
          shadow-xl
        `}
      >
        <div className={`p-4 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} mb-6`}>
          {isExpanded ? (
            <div className="flex items-center gap-3 fade-slide-in">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <span className="font-bold text-lg">D</span>
              </div>
              <span className="font-semibold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-100 to-white">DantSRI</span>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <span className="font-bold text-lg">D</span>
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-white p-2 rounded-md hover:bg-gray-700/50 transition-all duration-200 transform hover:scale-110 active:scale-90"
          >
            {isExpanded ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-4">
          <MenuGroup label={isExpanded ? "MENU" : ""}>
            <ul>
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={animateItems ? 'fade-slide-up' : 'opacity-0'}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <MenuItem
                    icon={item.icon}
                    title={isExpanded ? item.title : ""}
                    url={item.url}
                    isActive={activeItem === item.id}
                    onClick={handleItemClick}
                    id={item.id}
                  />
                </div>
              ))}
            </ul>
          </MenuGroup>
        </div>

        {isExpanded ? (
          <div className="mt-auto p-4 border-t border-gray-700/50">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-800/30">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center">
                  <span className="font-medium text-sm text-white">{userEmail ? userEmail.substring(0, 2).toUpperCase() : ''}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{userEmail}</p>
                </div>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 p-3 rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-auto p-4 flex flex-col items-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center cursor-pointer" title={userEmail}>
              <span className="font-medium text-sm text-white">{userEmail ? userEmail.substring(0, 2).toUpperCase() : ''}</span>
            </div>
            <button
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition-all duration-300"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}

      </CustomSidebar>

      {isMobile && !isExpanded && (
        <button
          onClick={toggleSidebar}
          className="fixed bottom-4 left-4 z-20 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 float-button"
        >
          <Menu size={24} />
        </button>
      )}

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeSlideIn {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes fadeSlideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        @keyframes floatButton {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes highlightTransition {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .fade-in {
          animation: fadeIn 0.3s ease forwards;
        }
        
        .fade-slide-in {
          animation: fadeSlideIn 0.3s ease forwards;
        }
        
        .fade-slide-up {
          animation: fadeSlideUp 0.5s ease forwards;
        }
        
        .scale-in {
          animation: scaleIn 0.3s ease forwards;
        }
        
        .float-button {
          animation: floatButton 0.5s ease forwards;
        }
      `}</style>
    </div>
  );
}