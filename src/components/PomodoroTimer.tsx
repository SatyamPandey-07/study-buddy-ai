import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { api } from "@/lib/api";

const POMODORO_TIME = 25 * 60; // 25 minutes
const BREAK_TIME = 5 * 60; // 5 minutes

interface PomodoroTimerProps {
  module?: string;
}

export default function PomodoroTimer({ module = "general" }: PomodoroTimerProps) {
  const [timeLeft, setTimeLeft] = useState(POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    if (!isBreak) {
      // Pomodoro completed - save session
      if (startTime) {
        const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);
        
        try {
          await api.post('/session/end', {
            module,
            duration,
            completed: true,
          });
        } catch (error) {
          console.error('Error saving session:', error);
        }
      }

      toast.success("🎉 Pomodoro Complete!", {
        description: "Great work! Time for a 5-minute break.",
      });
      setIsBreak(true);
      setTimeLeft(BREAK_TIME);
    } else {
      // Break completed
      toast.success("Break's over!", {
        description: "Ready for another Pomodoro?",
      });
      setIsBreak(false);
      setTimeLeft(POMODORO_TIME);
    }
  };

  const toggleTimer = () => {
    if (!isRunning) {
      setStartTime(new Date());
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsBreak(false);
    setTimeLeft(POMODORO_TIME);
    setStartTime(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = isBreak 
    ? ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100
    : ((POMODORO_TIME - timeLeft) / POMODORO_TIME) * 100;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`relative ${isRunning ? 'text-primary' : ''}`}
        >
          <Timer className="w-5 h-5" />
          {isRunning && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold mb-1">
              {isBreak ? "Break Time" : "Focus Time"}
            </h3>
            <div className="text-4xl font-mono font-bold text-primary">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-1000 ${
                isBreak ? 'bg-green-500' : 'bg-primary'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              variant={isRunning ? "destructive" : "default"}
              onClick={toggleTimer}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={resetTimer}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {isBreak ? "Enjoy your break!" : "Stay focused on your studies"}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
