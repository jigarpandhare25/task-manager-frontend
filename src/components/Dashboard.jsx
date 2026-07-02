import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, CheckCircle2, Clock, ListTodo, Plus, TrendingUp } from 'lucide-react';
import { dashboardApi } from '../api';

/**
 * Format a deadline timestamp into a short, locale-aware string.
 * Extracted from the render path so it can be called for both the
 * upcoming-tasks list and any future calendar widgets.
 */
const formatDate = (dateString) => {
  if (!dateString) return 'No deadline';
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

function Dashboard({ token, setActiveTab }) {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dashboardApi.getStats(token);
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) return <div style={{ color: 'var(--text-secondary)' }}>Loading statistics...</div>;
  if (error)   return <div style={{ color: 'var(--priority-high)' }}>Error: {error}</div>;

  const { totalTasks, overdueTasks, statusBreakdown, priorityBreakdown, upcomingTasks } = stats;
  const completedCount  = statusBreakdown.completed   || 0;
  const progressCount   = statusBreakdown.in_progress || 0;
  const pendingCount    = statusBreakdown.pending      || 0;
  const completionRate  = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Track your team productivity and upcoming deadlines.</p>
        </div>
        <button className="btn-primary" onClick={() => setActiveTab('tasks')}>
          <Plus size={18} /><span>New Task</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Total Tasks</span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)' }}>
              <ListTodo size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>{totalTasks}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Active in workspace</p>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Completed</span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--priority-low-bg)', color: 'var(--priority-low)' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>{completedCount}</h2>
          <p style={{ color: 'var(--priority-low)', fontSize: '0.8rem', fontWeight: 600 }}>{completionRate}% success rate</p>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Active Work</span>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--status-progress-bg)', color: 'var(--status-progress)' }}>
              <TrendingUp size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px' }}>{progressCount + pendingCount}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{progressCount} in progress, {pendingCount} pending</p>
        </div>

        <div className="glass-card" style={{
          padding: '24px',
          border: overdueTasks > 0 ? '1px solid rgba(239,68,68,0.2)' : '1px solid var(--border-color)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.9rem' }}>Overdue Tasks</span>
            <div style={{
              padding: '8px', borderRadius: 'var(--radius-sm)',
              backgroundColor: overdueTasks > 0 ? 'var(--priority-high-bg)' : 'var(--bg-tertiary)',
              color: overdueTasks > 0 ? 'var(--priority-high)' : 'var(--text-muted)',
            }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '4px', color: overdueTasks > 0 ? 'var(--priority-high)' : 'inherit' }}>
            {overdueTasks}
          </h2>
          <p style={{ color: overdueTasks > 0 ? 'var(--priority-high)' : 'var(--text-muted)', fontSize: '0.8rem', fontWeight: overdueTasks > 0 ? 600 : 400 }}>
            {overdueTasks > 0 ? 'Needs immediate attention' : 'All clear'}
          </p>
        </div>
      </div>

      {/* Analytics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Completion Rate */}
        <div className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, alignSelf: 'flex-start', marginBottom: '24px' }}>Completion Rate</h3>
          <div style={{ position: 'relative', width: '160px', height: '160px', marginBottom: '24px' }}>
            <svg width="100%" height="100%" viewBox="0 0 36 36" style={{ transform: 'rotate(-90deg)' }}>
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="var(--border-color)" strokeWidth="3" />
              <path strokeDasharray={`${completionRate}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="var(--accent-color)" strokeWidth="3.2" strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.8s ease-in-out' }} />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
              <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{completionRate}%</h1>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMPLETED</span>
            </div>
          </div>
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-around', fontSize: '0.85rem' }}>
            {[
              { color: 'var(--status-completed)', label: 'Done',    count: completedCount },
              { color: 'var(--status-progress)',  label: 'Active',  count: progressCount  },
              { color: 'var(--status-pending)',   label: 'Pending', count: pendingCount   },
            ].map(({ color, label, count }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, display: 'inline-block', marginRight: '6px' }}></div>
                <span style={{ color: 'var(--text-secondary)' }}>{label}: <strong>{count}</strong></span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="glass-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '24px' }}>Task Priorities</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', justifyContent: 'center' }}>
            {[
              { key: 'high',   label: 'High Priority',   color: 'var(--priority-high)'   },
              { key: 'medium', label: 'Medium Priority', color: 'var(--priority-medium)' },
              { key: 'low',    label: 'Low Priority',    color: 'var(--priority-low)'    },
            ].map(({ key, label, color }) => {
              const count = priorityBreakdown[key] || 0;
              const pct   = totalTasks > 0 ? (count / totalTasks) * 100 : 0;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }}></span>
                      {label}
                    </span>
                    <span>{count} tasks</span>
                  </div>
                  <div style={{ height: '8px', width: '100%', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: 'var(--radius-full)', transition: 'width 0.5s ease' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Calendar size={20} style={{ color: 'var(--accent-color)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Upcoming Deadlines (Next 7 Days)</h3>
        </div>

        {upcomingTasks.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            No upcoming deadlines this week. Keep it up!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingTasks.map((task) => {
              const isOverdue = task.deadline && new Date(task.deadline) < new Date();
              return (
                <div key={task.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)',
                  flexWrap: 'wrap', gap: '12px',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{task.title}</strong>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.team_name && (
                        <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                          Team: {task.team_name}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '500px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.description}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: isOverdue ? 'var(--priority-high)' : 'var(--text-secondary)' }}>
                    <Clock size={16} />
                    <span>{formatDate(task.deadline)}</span>
                    {isOverdue && <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>(OVERDUE)</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
