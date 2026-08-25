import { Link } from "wouter";
import { PortfolioItem } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Eye } from "lucide-react";

export function PortfolioCard({ item }: { item: PortfolioItem }) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 hover:border-primary/50 group">
      <Link href={`/portfolio/${item.id}`}>
        <div className="relative aspect-video overflow-hidden bg-muted cursor-pointer">
          {item.mediaUrl ? (
            <img 
              src={item.mediaUrl} 
              alt={item.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
              <span className="text-4xl font-bold text-primary/40">{item.title.substring(0, 2)}</span>
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-white capitalize">
            {item.type}
          </div>
        </div>
      </Link>
      
      <CardContent className="p-4">
        <Link href={`/portfolio/${item.id}`}>
          <h3 className="font-bold text-lg leading-tight mb-1 cursor-pointer hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
        </Link>
        <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        {item.author?.username ? (
          <Link href={`/profile/${item.author.username}`} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Avatar className="w-6 h-6 border border-border">
              <AvatarImage src={item.author?.avatarUrl || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{item.author?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{item.author?.displayName}</span>
          </Link>
        ) : (
          <div className="flex items-center gap-2">
            <Avatar className="w-6 h-6 border border-border">
              <AvatarImage src={item.author?.avatarUrl || undefined} />
              <AvatarFallback className="text-xs bg-primary/10 text-primary">{item.author?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">{item.author?.displayName}</span>
          </div>
        )}
        
        <div className="flex items-center gap-3 text-muted-foreground text-xs font-medium">
          <div className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span>{item.viewsCount || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            <span>{item.likesCount || 0}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
