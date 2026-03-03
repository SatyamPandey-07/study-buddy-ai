import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Flame, Trophy, Clock, Target, TrendingUp, BookOpen, ArrowLeft } from "lucide-react";
import { streakAPI } from "@/lib/api";
import { motion } from "framer-motion";

export default function StatsPage() {
  const navigate = useNavigate();
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['streak-dashboard'],
    queryFn: async () => {
      return await streakAPI.getDashboard();
    },
  });

  const { data: achievementsData } = useQuery({
    queryKey: ['achievements'],
    queryFn: async () => {
      return await streakAPI.getAchievements();
    },
  });

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Generate calendar heatmap data
  const generateCalendarData = () => {
    if (!dashboardData?.activityByDate) return [];
    
    const data = [];
    const today = new Date();
    
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const activity = dashboardData.activityByDate[dateStr];
      data.push({
        date: dateStr,
        count: activity?.count || 0,
        duration: activity?.duration || 0,
      });
    }
    
    return data;
  };

  const calendarData = generateCalendarData();

  const getHeatmapColor = (duration: number) => {
    if (duration === 0) return 'bg-muted';
    if (duration < 600) return 'bg-green-200 dark:bg-green-900';
    if (duration < 1800) return 'bg-green-300 dark:bg-green-700';
    if (duration < 3600) return 'bg-green-400 dark:bg-green-600';
    return 'bg-green-500 dark:bg-green-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4">
            <div className="text-center">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  const { streak, stats } = dashboardData || {};

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-2">
              Your Learning Journey
            </h1>
            <p className="text-muted-foreground">
              Track your progress, maintain streaks, and celebrate achievements
            </p>
          </motion.div>

          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                <Flame className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{streak?.currentStreak || 0} days</div>
                <p className="text-xs text-muted-foreground">
                  Longest: {streak?.longestStreak || 0} days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Study Time</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(streak?.totalStudyTime || 0)}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quizzes Completed</CardTitle>
                <Target className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.completedQuizzes || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.totalQuizzes || 0} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Flashcard Sets</CardTitle>
                <BookOpen className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalFlashcards || 0}</div>
                <p className="text-xs text-muted-foreground">Created</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Heatmap */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Activity Heatmap</CardTitle>
                <CardDescription>Your study activity over the last 90 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-10 sm:grid-cols-15 gap-1">
                  {calendarData.map((day, index) => (
                    <div
                      key={index}
                      className={`w-3 h-3 rounded-sm ${getHeatmapColor(day.duration)} cursor-pointer hover:ring-2 hover:ring-primary transition-all`}
                      title={`${day.date}: ${formatTime(day.duration)}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
                  <span>Less</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-sm bg-muted" />
                    <div className="w-3 h-3 rounded-sm bg-green-200 dark:bg-green-900" />
                    <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-700" />
                    <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600" />
                    <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-500" />
                  </div>
                  <span>More</span>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Achievements
                </CardTitle>
                <CardDescription>Your earned badges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {achievementsData?.achievements?.length > 0 ? (
                    achievementsData.achievements.map((achievement: { id: string; name: string; icon: string }) => (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                      >
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{achievement.name}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      Start studying to earn achievements!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Module Breakdown */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Study Activity</CardTitle>
              <CardDescription>Your recent study sessions</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboardData?.recentSessions?.length > 0 ? (
                <div className="space-y-2">
                  {dashboardData.recentSessions.slice(0, 5).map((session: { id: string; module: string; startedAt: string; duration: number }) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <div>
                          <div className="font-medium text-sm capitalize">{session.module}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(session.startedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm font-medium">
                        {formatTime(session.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No study sessions yet. Start learning to see your activity!
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
