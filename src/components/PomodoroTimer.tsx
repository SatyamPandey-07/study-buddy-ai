import { useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Timer, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { sessionAPI } from "@/lib/api";

const DEFAULT_POMODORO_TIME = 25 * 60; // 25 minutes
const DEFAULT_BREAK_TIME = 5 * 60; // 5 minutes

interface PomodoroTimerProps {
  module?: string;
}

export default function PomodoroTimer({ module = "general" }: PomodoroTimerProps) {
  const [pomodoroTime, setPomodoroTime] = useState(DEFAULT_POMODORO_TIME);
  const [breakTime, setBreakTime] = useState(DEFAULT_BREAK_TIME);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_POMODORO_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [pomodoroInput, setPomodoroInput] = useState("25");
  const [breakInput, setBreakInput] = useState("5");

  const handleTimerComplete = useCallback(async () => {
    setIsRunning(false);
    
    if (!isBreak) {
      // Pomodoro completed - save session
      if (startTime) {
        const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);
        
        try {
          await sessionAPI.endSession({
            module,
            duration,
            completed: true,
          });
        } catch (error) {
          console.error('Error saving session:', error);
        }
      }

      toast.success("🎉 Pomodoro Complete!", {
        description: "Great work! Time for a break.",
      });
      setIsBreak(true);
      setTimeLeft(breakTime);
    } else {
      // Break completed
      toast.success("Break's over!", {
        description: "Ready for another Pomodoro?",
      });
      setIsBreak(false);
      setTimeLeft(pomodoroTime);
    }
  }, [isBreak, module, pomodoroTime, breakTime, startTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, handleTimerComplete]);

  const updatePomodoroTime = () => {
    const newMinutes = Math.max(1, Math.min(120, parseInt(pomodoroInput) || 25));
    setPomodoroInput(newMinutes.toString());
    const newSeconds = newMinutes * 60;
    setPomodoroTime(newSeconds);
    if (!isRunning && !isBreak) {
      setTimeLeft(newSeconds);
    }
    toast.success(`Focus time set to ${newMinutes} minutes`);
  };

  const updateBreakTime = () => {
    const newMinutes = Math.max(1, Math.min(60, parseInt(breakInput) || 5));
    setBreakInput(newMinutes.toString());
    const newSeconds = newMinutes * 60;
    setBreakTime(newSeconds);
    if (!isRunning && isBreak) {
      setTimeLeft(newSeconds);
    }
    toast.success(`Break time set to ${newMinutes} minutes`);
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
    setTimeLeft(pomodoroTime);
    setStartTime(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTotal = isBreak ? breakTime : pomodoroTime;
  const progress = ((currentTotal - timeLeft) / currentTotal) * 100;

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
      <PopoverContent className="w-72">
        <div className="space-y-4">
          {!showSettings ? (
            <>
              {/* Timer Display */}
              <div className="text-center">
                <h3 className="font-semibold mb-1 text-sm">
                  {isBreak ? "Break Time" : "Focus Time"}
                </h3>
                <div className="text-4xl font-mono font-bold text-primary">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isBreak ? `${Math.ceil(timeLeft / 60)} min break` : `${Math.ceil(timeLeft / 60)} min focus`}
                </p>
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
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                {isBreak ? "Enjoy your break!" : "Stay focused on your studies"}
              </div>
            </>
          ) : (
            <>
              {/* Settings View */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Customize Times</h3>
                
                {/* Pomodoro Time Setting */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Focus Time (minutes)
                  </label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={pomodoroInput}
                      onChange={(e) => setPomodoroInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && updatePomodoroTime()}
                      className="h-8 text-sm"
                      placeholder="25"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={updatePomodoroTime}
                      className="text-xs"
                    >
                      Set
                    </Button>
                  </div>
                </div>

                {/* Break Time Setting */}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Break Time (minutes)
                  </label>
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={breakInput}
                      onChange={(e) => setBreakInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && updateBreakTime()}
                      className="h-8 text-sm"
                      placeholder="5"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={updateBreakTime}
                      className="text-xs"
                    >
                      Set
                    </Button>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-muted p-2 rounded text-xs space-y-1">
                  <p><strong>Current Focus:</strong> {Math.ceil(pomodoroTime / 60)} min</p>
                  <p><strong>Current Break:</strong> {Math.ceil(breakTime / 60)} min</p>
                </div>

                {/* Back Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                  className="w-full text-xs"
                >
                  Back to Timer
                </Button>
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
