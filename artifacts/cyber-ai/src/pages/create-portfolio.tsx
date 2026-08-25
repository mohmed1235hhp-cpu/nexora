import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreatePortfolioItem, useGetCategories, ApiError } from "@workspace/api-client-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Image as ImageIcon, Link as LinkIcon, Video, LayoutTemplate, FileText } from "lucide-react";

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  type: z.enum(["image", "website", "app", "video", "article"]),
  url: z.string().url().optional().or(z.literal('')),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export default function CreatePortfolio() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: categories } = useGetCategories();
  const createMutation = useCreatePortfolioItem();
  
  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { 
      title: "", 
      description: "",
      type: "image",
      url: "",
      mediaUrl: "",
      isPublic: true
    },
  });

  const onSubmit = (data: z.infer<typeof createSchema>) => {
    createMutation.mutate({
      ...data,
      tags: [] as string[], // Simplified for now
    } as any, {
      onSuccess: (res) => {
        toast({ title: "Portfolio item created!" });
        setLocation(`/portfolio/${res.id}`);
      },
      onError: (err: unknown) => {
        toast({ title: "Error", description: err instanceof ApiError ? err.message : "Something went wrong", variant: "destructive" });
      }
    });
  };

  const typeIcons = {
    image: <ImageIcon className="w-4 h-4" />,
    website: <LinkIcon className="w-4 h-4" />,
    app: <LayoutTemplate className="w-4 h-4" />,
    video: <Video className="w-4 h-4" />,
    article: <FileText className="w-4 h-4" />,
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Share Creation</h1>
          <p className="text-muted-foreground mt-2">Add a new AI-powered project to your portfolio.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. Neon Genesis Character Concept" {...field} className="text-lg py-6" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Media Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(typeIcons).map(([type, icon]) => (
                            <SelectItem key={type} value={type}>
                              <div className="flex items-center gap-2 capitalize">
                                {icon} {type}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories?.map((cat: { id: number; name: string }) => (
                            <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="mediaUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image/Media URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>Direct link to your artwork or video</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Link (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>Link to the live app, website or article</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell the story behind this creation... Prompts used, tools, inspiration." className="h-32" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-muted/30">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Public Visibility</FormLabel>
                      <FormDescription>
                        Project visibility
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full h-12 text-lg" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Publishing..." : "Publish Creation"}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </AppLayout>
  );
}
