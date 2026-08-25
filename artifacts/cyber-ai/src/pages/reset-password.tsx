import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";

export default function ResetPassword(){
 const [location,setLocation]=useLocation(); const [password,setPassword]=useState(""); const [status,setStatus]=useState("");
 const submit=async()=>{const token=new URLSearchParams(window.location.search).get("token"); if(!token){setStatus("رابط غير صالح");return;}
 const r=await fetch("/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({token,newPassword:password})});
 setStatus(r.ok?"تم تغيير كلمة المرور بنجاح ✅":"تعذر تغيير كلمة المرور");};
 return <AppLayout><div className="max-w-md mx-auto pt-16"><Card><CardHeader><CardTitle>إعادة تعيين كلمة المرور</CardTitle></CardHeader><CardContent className="space-y-4"><Input type="password" placeholder="كلمة المرور الجديدة" value={password} onChange={e=>setPassword(e.target.value)}/><Button onClick={submit}>تغيير كلمة المرور</Button><p>{status}</p><Button variant="ghost" onClick={()=>setLocation("/login")}>تسجيل الدخول</Button></CardContent></Card></div></AppLayout>;
}
