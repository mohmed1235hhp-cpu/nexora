import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";

export default function VerifyEmail() {
  const [location,setLocation]=useLocation();
  const [status,setStatus]=useState("جارٍ التحقق...");
  useEffect(()=>{ const token=new URLSearchParams(window.location.search).get("token");
    if(!token){setStatus("رابط التحقق غير صالح");return;}
    fetch("/api/auth/verify-email",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({token})})
      .then(r=>r.ok?setStatus("تم توثيق بريدك الإلكتروني بنجاح ✅"):setStatus("الرابط غير صالح أو منتهي"))
      .catch(()=>setStatus("تعذر إتمام التحقق"));
  },[]);
  return <AppLayout><div className="max-w-md mx-auto pt-16"><Card><CardHeader><CardTitle>توثيق البريد الإلكتروني</CardTitle></CardHeader><CardContent className="space-y-4"><p>{status}</p><Button onClick={()=>setLocation("/")}>العودة للرئيسية</Button></CardContent></Card></div></AppLayout>;
}
