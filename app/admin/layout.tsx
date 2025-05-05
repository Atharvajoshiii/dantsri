'use client';

import React, { useEffect, useState } from "react";
import { AppSidebar } from "@/components/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                
                if (error || !session) {
                    router.push('/');
                    return;
                }
                
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Auth error:', error);
                router.push('/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-xl font-semibold">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-xl font-semibold">Please login to access this page</div>
            </div>
        );
    }

    return (
        <SidebarProvider>
            <div className="flex h-screen">
                <AppSidebar>{children}</AppSidebar>
                <div className="flex-1 p-6 overflow-y-auto">{children}</div>
            </div>
        </SidebarProvider>
    );
}

