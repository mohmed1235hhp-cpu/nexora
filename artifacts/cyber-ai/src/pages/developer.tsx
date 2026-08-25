
import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { csrfHeaders } from "@/lib/csrf";

export default function Developer(){
 const [keys,setKeys]=useState<any[]>([]); const [name,setName]=useState("My App"); const [newKey,setNewKey]=useState("");
 const load=()=>fetch("/api/developer/api-keys",{credentials:"include"}).then(r=>r.json()).then(x=>setKeys(x.keys||[]));
 useEffect(() => { load(); }, []);
 const create=async()=>{const r=await fetch("/api/developer/api-keys",{method:"POST",headers:{"Content-Type":"application/json",...csrfHeaders()},credentials:"include",body:JSON.stringify({name})});const x=await r.json();if(x.key)setNewKey(x.key);load();};
 const revoke=async(id:number)=>{await fetch(`/api/developer/api-keys/${id}`,{method:"DELETE",credentials:"include",headers:{...csrfHeaders()}});load();};
 return <AppLayout><div className="max-w-3xl mx-auto space-y-5"><h1 className="text-3xl font-black">Developer Portal</h1><Card><CardHeader><CardTitle>مفتاح API شخصي</CardTitle></CardHeader><CardContent className="space-y-3"><div className="flex gap-2"><Input value={name} onChange={e=>setName(e.target.value)} /><Button onClick={create}>إنشاء</Button></div>{newKey&&<pre className="p-3 rounded bg-muted break-all">{newKey}</pre>}<p className="text-sm text-muted-foreground">يظهر المفتاح الكامل مرة واحدة فقط.</p></CardContent></Card><Card><CardHeader><CardTitle>المفاتيح</CardTitle></CardHeader><CardContent>{keys.map(k=><div key={k.id} className="flex items-center justify-between py-2 border-b"><span>{k.name} · {k.prefix}</span>{!k.revokedAt&&<Button variant="destructive" size="sm" onClick={()=>revoke(k.id)}>إلغاء</Button>}</div>)}</CardContent></Card></div></AppLayout>;
}
