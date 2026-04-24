/**
 * BlogAdmin.tsx
 *
 * Admin panel for managing blog posts stored in Supabase.
 * Only accessible to users with `user_metadata.is_admin = true`.
 *
 * Features:
 *  - List all posts (draft, published, archived)
 *  - Create / edit posts with a Markdown textarea editor
 *  - Publish / Unpublish / Delete controls
 *  - Language & status filters
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAllPostsAdmin,
  createPost,
  updatePost,
  publishPost,
  unpublishPost,
  deletePost,
  type CmsPost,
} from '@/services/blogService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MobileHeader } from '@/components/MobileHeader';
import { SkipToContent } from '@/components/SkipToContent';
import { SEO } from '@/components/SEO';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Globe,
  Eye,
  EyeOff,
  Save,
  X,
  ArrowLeft,
  FileText,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type FormState = Omit<CmsPost, 'id' | 'created_at' | 'updated_at'>;

const LANGUAGES = ['en', 'pt', 'es', 'ar', 'vi'] as const;
const CATEGORIES = [
  'Trading Strategies',
  'Tools & AI',
  'Risk Management',
  'Trading Psychology',
  'Market Analysis',
  'Education',
  'Other',
];
const STATUS_COLORS: Record<string, string> = {
  published: 'bg-green-500/20 text-green-400 border-green-500/30',
  draft: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  archived: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const emptyForm = (): FormState => ({
  slug: '',
  language: 'en',
  status: 'draft',
  title: '',
  description: '',
  content: '',
  meta_title: null,
  meta_description: null,
  focus_keyword: null,
  canonical: null,
  tags: null,
  hero_image: null,
  hero_image_alt: null,
  author: 'Gustavo',
  category: 'Trading Strategies',
  read_time: null,
  published_at: null,
});

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── Main Component ───────────────────────────────────────────────────────────

const BlogAdmin = () => {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();

  // ── Auth guard ──────────────────────────────────────────────────────────────
  const isAdmin = user?.user_metadata?.is_admin === true;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return <BlogAdminInner />;
};

// ─── Inner (after auth guard passes) ─────────────────────────────────────────

const BlogAdminInner = () => {
  const queryClient = useQueryClient();

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [editing, setEditing] = useState<CmsPost | null>(null); // null = list view
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [preview, setPreview] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: fetchAllPostsAdmin,
  });

  const filteredPosts = posts.filter((p) => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (filterLang !== 'all' && p.language !== filterLang) return false;
    return true;
  });

  // ── Mutations ───────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-posts'] });

  const createMut = useMutation({
    mutationFn: createPost,
    onSuccess: () => { toast.success('Post created!'); invalidate(); setCreating(false); setForm(emptyForm()); },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CmsPost> }) =>
      updatePost(id, updates),
    onSuccess: () => { toast.success('Post saved!'); invalidate(); setEditing(null); },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  const publishMut = useMutation({
    mutationFn: publishPost,
    onSuccess: () => { toast.success('Published!'); invalidate(); },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  const unpublishMut = useMutation({
    mutationFn: unpublishPost,
    onSuccess: () => { toast.success('Moved to draft.'); invalidate(); },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  const deleteMut = useMutation({
    mutationFn: deletePost,
    onSuccess: () => { toast.success('Deleted.'); invalidate(); },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const startEdit = (post: CmsPost) => {
    setEditing(post);
    setCreating(false);
    setForm({
      slug: post.slug,
      language: post.language,
      status: post.status,
      title: post.title,
      description: post.description,
      content: post.content,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      focus_keyword: post.focus_keyword,
      canonical: post.canonical,
      tags: post.tags,
      hero_image: post.hero_image,
      hero_image_alt: post.hero_image_alt,
      author: post.author,
      category: post.category,
      read_time: post.read_time,
      published_at: post.published_at,
    });
    setPreview(false);
  };

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(emptyForm());
    setPreview(false);
  };

  const cancelEdit = () => { setEditing(null); setCreating(false); setForm(emptyForm()); };

  const handleSave = () => {
    const payload = {
      ...form,
      tags: form.tags?.length ? form.tags : null,
      slug: form.slug || slugify(form.title),
    };
    if (creating) {
      createMut.mutate(payload);
    } else if (editing) {
      updateMut.mutate({ id: editing.id, updates: payload });
    }
  };

  const handleDelete = (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteMut.mutate(id);
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // ── Auto-generate slug from title (only when creating) ──────────────────────
  useEffect(() => {
    if (creating && form.title && !form.slug) {
      setField('slug', slugify(form.title));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.title]);

  // ── Editor View ─────────────────────────────────────────────────────────────
  if (editing || creating) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <SEO title="Blog Admin — Edit Post | The Trading Diary" description="" canonical="" />
        <SkipToContent />
        <MobileHeader />

        <main id="main-content" className="pt-20 pb-16 px-4">
          <div className="max-w-5xl mx-auto">
            {/* Header bar */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back to list
              </button>
              <h1 className="text-2xl font-bold flex-1 text-center">
                {creating ? 'New Post' : `Editing: ${editing?.title}`}
              </h1>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreview((v) => !v)}
                >
                  {preview ? <Edit className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {preview ? 'Edit' : 'Preview'}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={createMut.isPending || updateMut.isPending}
                >
                  <Save className="w-4 h-4 mr-1" />
                  {createMut.isPending || updateMut.isPending ? 'Saving…' : 'Save'}
                </Button>
                <Button variant="ghost" size="sm" onClick={cancelEdit}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {preview ? (
              // ── Markdown preview ────────────────────────────────────────────
              <div className="prose prose-invert max-w-none bg-card rounded-lg p-8 border border-border">
                <h1>{form.title}</h1>
                <p className="text-muted-foreground">{form.description}</p>
                <hr />
                {/* Simple preview — ReactMarkdown not imported here; use pre */}
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                  {form.content}
                </pre>
              </div>
            ) : (
              // ── Edit form ───────────────────────────────────────────────────
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: main content */}
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Title *</label>
                    <Input
                      value={form.title}
                      onChange={(e) => setField('title', e.target.value)}
                      placeholder="Article title"
                      className="text-lg font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Slug</label>
                    <Input
                      value={form.slug}
                      onChange={(e) => setField('slug', e.target.value)}
                      placeholder="auto-generated-from-title"
                      className="font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Description / Excerpt *</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setField('description', e.target.value)}
                      placeholder="Short description for blog card and SEO meta"
                      rows={3}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Content (Markdown) *</label>
                    <textarea
                      value={form.content}
                      onChange={(e) => setField('content', e.target.value)}
                      placeholder={`# Heading\n\nWrite your article in **Markdown** here...\n\n## Section\n\nParagraph text.`}
                      rows={28}
                      className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                    />
                  </div>
                </div>

                {/* Right: meta / settings */}
                <div className="space-y-4">
                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Settings</h3>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Language</label>
                      <select
                        value={form.language}
                        onChange={(e) => setField('language', e.target.value)}
                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                      >
                        {LANGUAGES.map((l) => (
                          <option key={l} value={l}>{l.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setField('category', e.target.value)}
                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Author</label>
                      <Input
                        value={form.author}
                        onChange={(e) => setField('author', e.target.value)}
                        placeholder="Gustavo"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Read Time</label>
                      <Input
                        value={form.read_time ?? ''}
                        onChange={(e) => setField('read_time', e.target.value || null)}
                        placeholder="8 min read"
                      />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">SEO</h3>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Meta Title</label>
                      <Input
                        value={form.meta_title ?? ''}
                        onChange={(e) => setField('meta_title', e.target.value || null)}
                        placeholder="Defaults to article title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Meta Description</label>
                      <textarea
                        value={form.meta_description ?? ''}
                        onChange={(e) => setField('meta_description', e.target.value || null)}
                        placeholder="155 chars max"
                        rows={2}
                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Focus Keyword</label>
                      <Input
                        value={form.focus_keyword ?? ''}
                        onChange={(e) => setField('focus_keyword', e.target.value || null)}
                        placeholder="crypto trading journal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Tags (comma-separated)</label>
                      <Input
                        value={form.tags?.join(', ') ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setField('tags', val ? val.split(',').map((t) => t.trim()).filter(Boolean) : null);
                        }}
                        placeholder="crypto, trading, risk"
                      />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Media</h3>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Hero Image URL</label>
                      <Input
                        value={form.hero_image ?? ''}
                        onChange={(e) => setField('hero_image', e.target.value || null)}
                        placeholder="/blog/covers/my-post.webp"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Hero Image Alt</label>
                      <Input
                        value={form.hero_image_alt ?? ''}
                        onChange={(e) => setField('hero_image_alt', e.target.value || null)}
                        placeholder="Descriptive alt text"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── List View ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SEO title="Blog Admin | The Trading Diary" description="" canonical="" />
      <SkipToContent />
      <MobileHeader />

      <main id="main-content" className="pt-20 pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold">Blog Admin</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {posts.length} posts total
              </p>
            </div>
            <Button onClick={startCreate} className="gap-2">
              <Plus className="w-4 h-4" /> New Post
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-1">
              {['all', 'published', 'draft', 'archived'].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={filterStatus === s ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
            <div className="flex gap-1">
              {['all', ...LANGUAGES].map((l) => (
                <Button
                  key={l}
                  size="sm"
                  variant={filterLang === l ? 'default' : 'outline'}
                  onClick={() => setFilterLang(l)}
                  className="uppercase"
                >
                  {l}
                </Button>
              ))}
            </div>
          </div>

          {/* Posts table */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No posts found. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-4 bg-card border border-border rounded-lg p-4 hover:border-primary/40 transition-colors"
                >
                  {/* Status badge */}
                  <span
                    className={`shrink-0 text-xs px-2 py-1 rounded border font-medium ${STATUS_COLORS[post.status]}`}
                  >
                    {post.status}
                  </span>

                  {/* Lang */}
                  <span className="shrink-0 text-xs font-mono text-muted-foreground w-6">
                    {post.language.toUpperCase()}
                  </span>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      /blog/{post.slug} · {post.category}
                    </p>
                  </div>

                  {/* Date */}
                  <span className="shrink-0 text-xs text-muted-foreground hidden sm:block">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString()
                      : new Date(post.created_at).toLocaleDateString()}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Edit"
                      onClick={() => startEdit(post)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>

                    {post.status === 'published' ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Unpublish (move to draft)"
                        onClick={() => unpublishMut.mutate(post.id)}
                        disabled={unpublishMut.isPending}
                      >
                        <EyeOff className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Publish"
                        className="text-green-400 hover:text-green-300"
                        onClick={() => publishMut.mutate(post.id)}
                        disabled={publishMut.isPending}
                      >
                        <Globe className="w-4 h-4" />
                      </Button>
                    )}

                    <Button
                      size="icon"
                      variant="ghost"
                      title="Delete"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(post.id, post.title)}
                      disabled={deleteMut.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BlogAdmin;
