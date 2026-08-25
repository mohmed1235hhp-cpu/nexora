import { useGetPortfolioItem, useLikePortfolioItem, useAddPortfolioComment, useListItemComments } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Share2, Eye, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function PortfolioDetail({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const id = parseInt(params.id);
  const { data: item, isLoading, refetch } = useGetPortfolioItem(id, { query: { enabled: !!id, queryKey: ["portfolio", id] } });
  const { data: commentsData, refetch: refetchComments } = useListItemComments(id, undefined, { query: { enabled: !!id, queryKey: ["comments", id] } });
  
  const likeMutation = useLikePortfolioItem();
  const commentMutation = useAddPortfolioComment();
  const [commentText, setCommentText] = useState("");

  const handleLike = () => {
    likeMutation.mutate(id, {
      onSuccess: () => refetch()
    });
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    commentMutation.mutate({ portfolioItemId: id, content: commentText }, {
      onSuccess: () => {
        setCommentText("");
        refetchComments();
        refetch();
        toast({ title: "Comment posted" });
      }
    });
  };

  if (isLoading) return <AppLayout><div className="p-12 text-center text-muted-foreground">Loading artwork...</div></AppLayout>;
  if (!item) return <AppLayout><div className="p-12 text-center">Not found</div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto pb-16">
        
        {/* Media Display */}
        <div className="w-full bg-black rounded-xl overflow-hidden shadow-2xl mb-8 flex items-center justify-center min-h-[40vh] max-h-[80vh] border border-border/50">
          {item.mediaUrl ? (
            <img src={item.mediaUrl} alt={item.title} className="max-w-full max-h-[80vh] object-contain" />
          ) : (
            <div className="text-muted-foreground opacity-50 py-32 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-4 text-4xl">
                {item.title[0]}
              </div>
              <p>No media attached</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="capitalize">{item.type}</Badge>
                {item.category && <Badge variant="outline">{item.category}</Badge>}
              </div>
              <h1 className="text-4xl font-black tracking-tight mb-4">{item.title}</h1>
              <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.description}</p>
              
              {item.url && (
                <div className="mt-6">
                  <a href={item.url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="gap-2 rounded-full">
                      <ExternalLink className="w-4 h-4" /> Visit Project Link
                    </Button>
                  </a>
                </div>
              )}

            </div>

            <Separator />

            {/* Comments Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" /> 
                {item.commentsCount || 0} Comments
              </h3>
              
              <div className="flex gap-4">
                <Avatar className="w-10 h-10 mt-1">
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea 
                    placeholder="Leave a thoughtful comment..." 
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="min-h-[100px] resize-y bg-muted/50 border-transparent focus:border-primary"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleComment} disabled={commentMutation.isPending || !commentText.trim()}>
                      {commentMutation.isPending ? "Posting..." : "Post Comment"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-6 mt-8">
                {commentsData?.comments?.map(comment => (
                  <div key={comment.id} className="flex gap-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={comment.author?.avatarUrl || undefined} />
                      <AvatarFallback>{comment.author?.displayName?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 bg-card border border-border/50 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{comment.author?.displayName}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Created By</h4>
              <Link href={item.author?.username ? `/profile/${item.author.username}` : "#"} className="flex items-center gap-4 mb-4 hover:opacity-80 transition-opacity">
                <Avatar className="w-14 h-14 border-2 border-primary/20">
                  <AvatarImage src={item.author?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">{item.author?.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{item.author?.displayName}</h3>
                  <p className="text-sm text-muted-foreground">@{item.author?.username}</p>
                </div>
              </Link>
            </div>

            {/* Actions Card */}
            <div className="bg-card border border-border rounded-xl p-2 shadow-sm flex flex-col gap-1">
              <Button 
                variant="ghost" 
                className={`w-full justify-between h-12 px-4 rounded-lg ${item.isLiked ? 'text-pink-500 bg-pink-500/10 hover:bg-pink-500/20' : ''}`}
                onClick={handleLike}
              >
                <div className="flex items-center gap-3">
                  <Heart className={`w-5 h-5 ${item.isLiked ? 'fill-current' : ''}`} />
                  <span className="font-medium">Like</span>
                </div>
                <span className="font-bold">{item.likesCount || 0}</span>
              </Button>
              
              <div className="flex items-center justify-between px-4 h-12 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5" />
                  <span className="font-medium">Views</span>
                </div>
                <span className="font-bold">{item.viewsCount || 0}</span>
              </div>
              
              <Button variant="ghost" className="w-full justify-start gap-3 h-12 px-4 rounded-lg text-muted-foreground hover:text-foreground">
                <Share2 className="w-5 h-5" />
                <span className="font-medium">Share Project</span>
              </Button>
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="px-3 py-1 font-medium bg-muted/50 hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
