import { useState } from "react";
import { useLocation } from "wouter";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
export default function ForgotPassword(){const [email,setEmail]=useState("");const [status,setStatus]=useState("");const [,setLocation]=useLocation();const submit=async()=>{const r=await fetch("/api/auth/forgot-password",{method:"POST",headers:{"Content-Type":"application/json"},credentials:"include",body:JSON.stringify({email})});setStatus(r.ok?"إذا كان الحساب موجودًا، تم إرسال رابط إعادة التعيين.":"حدث خطأ");};return <AppLayout><div className="max-w-md mx-auto pt-16"><Card><CardHeader><CardTitle>نسيت كلمة المرور؟</CardTitle></CardHeader><CardContent className="space-y-4"><Input type="email" placeholder="البريد الإلكتروني" value={email} onChange={e=>setEmail(e.target.value)}/><Button onClick={submit}>إرسال رابط الاستعادة</Button><p>{status}</p><Button variant="ghost" onClick={()=>setLocation("/login")}>العودة للدخول</Button></CardContent></Card></div></AppLayout>}
