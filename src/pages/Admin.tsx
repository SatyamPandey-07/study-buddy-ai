import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Users,
  BarChart3,
  Activity,
  Brain,
  Layers,
  FileText,
  BookOpen,
  Clock,
  Trash2,
  ShieldCheck,
  ShieldOff,
  Search,
  ArrowLeft,
  TrendingUp,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import { adminAPI } from "@/lib/api";

type Tab = "overview" | "users" | "activity";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [userSearch, setUserSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Debounce search
  const handleSearch = (v: string) => {
    setUserSearch(v);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => {
      setDebouncedSearch(v);
      setUserPage(1);
    }, 400);
  };

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => adminAPI.getStats(),
    enabled: tab === "overview",
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch, roleFilter, userPage],
    queryFn: () =>
      adminAPI.getUsers({
        search: debouncedSearch,
        role: roleFilter === "all" ? undefined : roleFilter,
        page: userPage,
      }),
    enabled: tab === "users",
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: () => adminAPI.getActivity(),
    enabled: tab === "activity",
  });

  const setRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "USER" | "ADMIN" }) =>
      adminAPI.setRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Role updated");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to update role"),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => adminAPI.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("User deleted");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to delete user"),
  });

  const users = usersData?.users || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-destructive" />
              </div>
              <h1 className="font-heading text-3xl font-bold text-foreground">Admin Panel</h1>
            </div>
            <p className="text-muted-foreground ml-13">
              Manage users, monitor activity, and control roles
            </p>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-8">
            {(
              [
                { id: "overview", label: "Overview", icon: BarChart3 },
                { id: "users", label: "Users", icon: Users },
                { id: "activity", label: "Activity", icon: Activity },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  tab === id
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "bg-card hover:bg-muted text-muted-foreground border border-border"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {tab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {statsLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : (
                <>
                  {/* Stat cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[
                      {
                        label: "Total Users",
                        value: stats?.totalUsers ?? 0,
                        icon: Users,
                        color: "text-blue-500",
                      },
                      {
                        label: "Quizzes",
                        value: stats?.totalQuizzes ?? 0,
                        icon: Brain,
                        color: "text-green-500",
                      },
                      {
                        label: "Flashcard Sets",
                        value: stats?.totalFlashcardSets ?? 0,
                        icon: Layers,
                        color: "text-purple-500",
                      },
                      {
                        label: "Summaries",
                        value: stats?.totalSummaries ?? 0,
                        icon: FileText,
                        color: "text-yellow-500",
                      },
                      {
                        label: "Study Sessions",
                        value: stats?.totalSessions ?? 0,
                        icon: Clock,
                        color: "text-orange-500",
                      },
                      {
                        label: "Resources",
                        value: stats?.totalResources ?? 0,
                        icon: FolderOpen,
                        color: "text-teal-500",
                      },
                      {
                        label: "Total Study Time",
                        value: formatTime(stats?.totalStudyTime ?? 0),
                        icon: TrendingUp,
                        color: "text-pink-500",
                      },
                      {
                        label: "Avg Session",
                        value: formatTime(stats?.avgSessionDuration ?? 0),
                        icon: Activity,
                        color: "text-indigo-500",
                      },
                    ].map(({ label, value, icon: Icon, color }) => (
                      <Card key={label}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">{label}</CardTitle>
                          <Icon className={`h-4 w-4 ${color}`} />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">{value}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Signups sparkline */}
                  {stats?.signupsByDay && (
                    <Card>
                      <CardHeader>
                        <CardTitle>New Signups (Last 7 Days)</CardTitle>
                        <CardDescription>Daily user registrations</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-end gap-2 h-24">
                          {Object.entries(stats.signupsByDay).map(([date, count]) => {
                            const max = Math.max(
                              1,
                              ...Object.values(stats.signupsByDay as Record<string, number>)
                            );
                            const pct = ((count as number) / max) * 100;
                            return (
                              <div
                                key={date}
                                className="flex-1 flex flex-col items-center gap-1"
                              >
                                <div
                                  className="w-full bg-primary/80 rounded-t-sm transition-all"
                                  style={{ height: `${Math.max(4, pct)}%` }}
                                  title={`${date}: ${count} signups`}
                                />
                                <span className="text-[10px] text-muted-foreground rotate-45 origin-top-left translate-x-1">
                                  {date.slice(5)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* ── USERS TAB ── */}
          {tab === "users" && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={userSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search by email or name…"
                    className="pl-9"
                  />
                </div>
                <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setUserPage(1); }}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardContent className="p-0">
                  {usersLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading users…</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="hidden md:table-cell">Joined</TableHead>
                          <TableHead className="hidden lg:table-cell">Content</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No users found
                            </TableCell>
                          </TableRow>
                        )}
                        {users.map(
                          (user: {
                            id: string;
                            email: string;
                            name?: string;
                            role: "USER" | "ADMIN";
                            createdAt: string;
                            _count: {
                              quizzes: number;
                              flashcards: number;
                              summaries: number;
                              conversations: number;
                            };
                          }) => (
                            <TableRow key={user.id}>
                              <TableCell>
                                <div>
                                  <div className="font-medium">
                                    {user.name || "—"}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {user.email}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={user.role === "ADMIN" ? "destructive" : "secondary"}
                                  className="gap-1"
                                >
                                  {user.role === "ADMIN" ? (
                                    <ShieldCheck className="w-3 h-3" />
                                  ) : (
                                    <ShieldOff className="w-3 h-3" />
                                  )}
                                  {user.role}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                {formatDate(user.createdAt)}
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                  <span title="Quizzes">
                                    <Brain className="w-3 h-3 inline mr-0.5" />
                                    {user._count.quizzes}
                                  </span>
                                  <span title="Flashcard Sets">
                                    <Layers className="w-3 h-3 inline mr-0.5" />
                                    {user._count.flashcards}
                                  </span>
                                  <span title="Summaries">
                                    <FileText className="w-3 h-3 inline mr-0.5" />
                                    {user._count.summaries}
                                  </span>
                                  <span title="Conversations">
                                    <BookOpen className="w-3 h-3 inline mr-0.5" />
                                    {user._count.conversations}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Toggle role */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={setRoleMutation.isPending}
                                    onClick={() =>
                                      setRoleMutation.mutate({
                                        userId: user.id,
                                        role: user.role === "ADMIN" ? "USER" : "ADMIN",
                                      })
                                    }
                                    title={
                                      user.role === "ADMIN"
                                        ? "Demote to User"
                                        : "Promote to Admin"
                                    }
                                  >
                                    {user.role === "ADMIN" ? (
                                      <ShieldOff className="w-3.5 h-3.5" />
                                    ) : (
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                    )}
                                  </Button>

                                  {/* Delete user */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive"
                                        aria-label={`Delete ${user.email}`}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete user?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This permanently deletes <strong>{user.email}</strong> and
                                          all their data (quizzes, flashcards, sessions, etc.). This
                                          cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          onClick={() => deleteUserMutation.mutate(user.id)}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Pagination */}
              {usersData && usersData.total > 20 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {usersData.total} users · page {userPage}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={userPage === 1}
                      onClick={() => setUserPage((p) => p - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!usersData.hasMore}
                      onClick={() => setUserPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── ACTIVITY TAB ── */}
          {tab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Recent Study Sessions</CardTitle>
                  <CardDescription>Last 50 sessions across all users</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {activityLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading…</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Module</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(activityData?.sessions || []).map(
                          (s: {
                            id: string;
                            module: string;
                            duration: number;
                            startedAt: string;
                            user: { email: string; name?: string };
                          }) => (
                            <TableRow key={s.id}>
                              <TableCell>
                                <div className="font-medium text-sm">
                                  {s.user.name || s.user.email}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {s.user.email}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {s.module}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatTime(s.duration)}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(s.startedAt)}
                              </TableCell>
                            </TableRow>
                          )
                        )}
                        {(activityData?.sessions || []).length === 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center py-8 text-muted-foreground"
                            >
                              No sessions recorded yet
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
