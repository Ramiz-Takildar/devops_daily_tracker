import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Play, Pause, Square, Zap } from 'lucide-react';
import PropTypes from 'prop-types';

const TimeInput = ({ value, onChange, suggestions = [], label = 'Hours Spent' }) => {
  const [mode, setMode] = useState('manual'); // 'manual' or 'timer'
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('0');
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Parse initial value into hours and minutes
  useEffect(() => {
    if (value) {
      const totalHours = parseFloat(value);
      const h = Math.floor(totalHours);
      const m = Math.round((totalHours - h) * 60);
      setHours(h.toString());
      setMinutes(m.toString());
    }
  }, [value]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (isTimerRunning && mode === 'timer') {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, mode]);

  // Update parent component when hours/minutes change
  const updateValue = (h, m) => {
    const totalHours = parseInt(h || 0) + parseInt(m || 0) / 60;
    onChange(totalHours.toFixed(2));
  };

  const handleHoursChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 24)) {
      setHours(val);
      updateValue(val, minutes);
    }
  };

  const handleMinutesChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
      setMinutes(val);
      updateValue(hours, val);
    }
  };

  const addPreset = (presetMinutes) => {
    const totalMinutes = parseInt(hours || 0) * 60 + parseInt(minutes || 0) + presetMinutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMinutes = totalMinutes % 60;
    setHours(newHours.toString());
    setMinutes(newMinutes.toString());
    updateValue(newHours.toString(), newMinutes.toString());
  };

  const startTimer = () => {
    setIsTimerRunning(true);
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const stopTimer = () => {
    setIsTimerRunning(false);
    const totalMinutes = Math.floor(timerSeconds / 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    setHours(h.toString());
    setMinutes(m.toString());
    updateValue(h.toString(), m.toString());
    setTimerSeconds(0);
    setMode('manual');
  };

  const formatTimerDisplay = () => {
    const h = Math.floor(timerSeconds / 3600);
    const m = Math.floor((timerSeconds % 3600) / 60);
    const s = timerSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const applySuggestion = (suggestionValue) => {
    const totalHours = parseFloat(suggestionValue);
    const h = Math.floor(totalHours);
    const m = Math.round((totalHours - h) * 60);
    setHours(h.toString());
    setMinutes(m.toString());
    updateValue(h.toString(), m.toString());
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-4">
      {/* Label and Mode Toggle */}
      <div className="flex items-center justify-between">
        <label className="label flex items-center gap-2">
          <Clock size={16} className="text-[color:var(--accent)]" />
          {label} *
        </label>
        <div className="flex items-center gap-2 rounded-full border border-theme bg-[color:var(--surface-soft)] p-1">
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              mode === 'manual'
                ? 'bg-[color:var(--accent)] text-white'
                : 'text-theme-muted hover:text-theme'
            }`}
          >
            Manual
          </button>
          <button
            type="button"
            onClick={() => setMode('timer')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              mode === 'timer'
                ? 'bg-[color:var(--accent)] text-white'
                : 'text-theme-muted hover:text-theme'
            }`}
          >
            Timer
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'manual' ? (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4"
          >
            {/* Time Input Fields */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={hours}
                    onChange={handleHoursChange}
                    className="input pr-8 text-center text-2xl font-bold"
                    placeholder="0"
                    maxLength="2"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-theme-muted">
                    h
                  </span>
                </div>
              </div>
              <span className="text-2xl font-bold text-theme-muted">:</span>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={minutes}
                    onChange={handleMinutesChange}
                    className="input pr-8 text-center text-2xl font-bold"
                    placeholder="0"
                    maxLength="2"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-theme-muted">
                    m
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Add Buttons */}
            <div className="flex flex-wrap gap-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addPreset(30)}
                className="btn btn-secondary btn-sm flex-1"
              >
                <Zap size={14} />
                +30m
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addPreset(60)}
                className="btn btn-secondary btn-sm flex-1"
              >
                <Zap size={14} />
                +1h
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addPreset(120)}
                className="btn btn-secondary btn-sm flex-1"
              >
                <Zap size={14} />
                +2h
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addPreset(240)}
                className="btn btn-secondary btn-sm flex-1"
              >
                <Zap size={14} />
                +4h
              </motion.button>
            </div>

            {/* Smart Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  className="text-xs font-semibold text-[color:var(--accent)] hover:underline"
                >
                  {showSuggestions ? 'Hide' : 'Show'} suggestions based on your history
                </button>
                <AnimatePresence>
                  {showSuggestions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex flex-wrap gap-2"
                    >
                      {suggestions.map((suggestion, index) => (
                        <motion.button
                          key={index}
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => applySuggestion(suggestion.value)}
                          className="rounded-full border border-theme bg-[color:var(--surface-soft)] px-3 py-1 text-xs font-semibold text-theme hover:bg-[color:var(--accent)] hover:text-white"
                        >
                          {suggestion.label}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Helper Text */}
            <p className="text-xs text-theme-muted">
              Enter time in hours and minutes. Use quick add buttons for common durations.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="timer"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-4"
          >
            {/* Timer Display */}
            <div className="rounded-2xl border border-theme bg-[color:var(--surface-soft)] p-6 text-center">
              <div className="text-5xl font-bold text-theme">{formatTimerDisplay()}</div>
              <p className="mt-2 text-xs text-theme-muted">
                {isTimerRunning ? 'Timer is running...' : 'Timer is paused'}
              </p>
            </div>

            {/* Timer Controls */}
            <div className="flex gap-3">
              {!isTimerRunning ? (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startTimer}
                  className="btn btn-primary flex-1"
                >
                  <Play size={18} />
                  Start
                </motion.button>
              ) : (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={pauseTimer}
                  className="btn btn-secondary flex-1"
                >
                  <Pause size={18} />
                  Pause
                </motion.button>
              )}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={stopTimer}
                disabled={timerSeconds === 0}
                className="btn btn-danger flex-1 disabled:opacity-50"
              >
                <Square size={18} />
                Stop & Save
              </motion.button>
            </div>

            {/* Helper Text */}
            <p className="text-xs text-theme-muted">
              Start the timer when you begin working. Stop to save the duration to your entry.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

TimeInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  suggestions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  label: PropTypes.string,
};

export default TimeInput;
