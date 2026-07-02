import React, { useState, useEffect } from 'react';
import { Plus, Search, Kanban, List, Edit2, Trash2, Calendar, User, Check, ChevronRight, X, Info } from 'lucide-react';
import { tasksApi, teamsApi } from '../api';

/**
 * Format a deadline timestamp for display in cards and table rows.
 * Returning an empty string (rather than null) lets callers use the
 * 'No deadline' fallback with a simple `||` without extra checks.
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

/** A task is overdue if it has a deadline, that deadline has passed, and it isn't done. */
const isOverdue = (task) =>
  task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed';

function Tasks({ token }) {
  const [tasks, setTasks]             = useState([]);
  const [teams, setTeams]             = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [viewMode, setViewMode]       = useState('kanban');

  // Filter state
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter]       = useState('');
  const [dateFilter, setDateFilter]       = useState('');

  // Modal / form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [title, setTitle]             = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]       = useState('medium');
  const [status, setStatus]           = useState('pending');
  const [deadline, setDeadline]       = useState('');
  const [teamId, setTeamId]           = useState('');
  const [assignedTo, setAssignedTo]   = useState('');
  const [formError, setFormError]     = useState('');

  useEffect(() => {
    fetchTasks();
    fetchTeams();
  }, [statusFilter, priorityFilter, typeFilter, dateFilter, search]);

  // Load team members whenever the team selection in the form changes
  useEffect(() => {
    if (teamId) {
      teamsApi.getMembers(token, teamId)
        .then(setTeamMembers)
        .catch(() => setTeamMembers([]));
    } else {
      setTeamMembers([]);
      setAssignedTo('');
    }
  }, [teamId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const data = await tasksApi.getAll(token, {
        status:   statusFilter,
        priority: priorityFilter,
        teamId:   typeFilter,
        search:   search,
        dueDate:  dateFilter,
      });
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const data = await teamsApi.getAll(token);
      setTeams(data);
    } catch (err) {
      console.error('Error fetching teams:', err);
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setTitle(''); setDescription(''); setPriority('medium');
    setStatus('pending'); setDeadline(''); setTeamId(''); setAssignedTo('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPriority(task.priority);
    setStatus(task.status);

    // Convert UTC timestamp to the local "YYYY-MM-DDTHH:MM" format the
    // datetime-local input expects, accounting for the user's timezone offset
    if (task.deadline) {
      const d = new Date(task.deadline);
      setDeadline(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    } else {
      setDeadline('');
    }

    setTeamId(task.team_id || '');
    setAssignedTo(task.assigned_to || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Task title is required');
      return;
    }

    const taskData = {
      title: title.trim(),
      description,
      priority,
      status,
      deadline:    deadline ? new Date(deadline).toISOString() : null,
      team_id:     teamId      ? parseInt(teamId)      : null,
      assigned_to: assignedTo  ? parseInt(assignedTo)  : null,
    };

    try {
      if (editingTask) {
        await tasksApi.update(token, editingTask.id, taskData);
      } else {
        await tasksApi.create(token, taskData);
      }
      setIsModalOpen(false);
      fetchTasks();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await tasksApi.delete(token, id);
      fetchTasks();
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const handleQuickStatusChange = async (task, newStatus) => {
    try {
      await tasksApi.update(token, task.id, { status: newStatus });
      fetchTasks();
    } catch (err) {
      console.error('Status change failed:', err);
    }
  };

  const getTasksByStatus = (s) => tasks.filter((t) => t.status === s);

  const KANBAN_COLUMNS = [
    { key: 'pending',     label: 'Pending',     color: 'var(--status-pending)'   },
    { key: 'in_progress', label: 'In Progress', color: 'var(--status-progress)'  },
    { key: 'completed',   label: 'Completed',   color: 'var(--status-completed)' },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px' }}>Tasks</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage, edit and progress your items.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* View toggle */}
          <div className="glass-card" style={{ display: 'flex', padding: '4px', gap: '4px' }}>
            {[{ key: 'kanban', icon: <Kanban size={16} />, label: 'Board' }, { key: 'list', icon: <List size={16} />, label: 'List' }].map(({ key, icon, label }) => (
              <button key={key} className={`theme-toggle ${viewMode === key ? 'active' : ''}`}
                onClick={() => setViewMode(key)}
                style={{ borderRadius: 'var(--radius-sm)', padding: '6px 12px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                {icon}<span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label}</span>
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={openCreateModal}>
            <Plus size={18} /><span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '28px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input type="text" className="form-control" placeholder="Search tasks..." value={search}
            onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '36px', height: '40px' }} />
        </div>

        <select className="form-control" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} style={{ height: '40px' }}>
          <option value="">All Priorities</option>
          <option value="high">High Priority</option>
          <option value="medium">Medium Priority</option>
          <option value="low">Low Priority</option>
        </select>

        {viewMode === 'list' && (
          <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ height: '40px' }}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        )}

        <select className="form-control" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{ height: '40px' }}>
          <option value="">All Tasks (Personal & Team)</option>
          <option value="personal">Personal Tasks Only</option>
          {teams.map((t) => <option key={t.id} value={t.id}>Team: {t.name}</option>)}
        </select>

        <select className="form-control" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ height: '40px' }}>
          <option value="">Any Deadline</option>
          <option value="today">Due Today</option>
          <option value="week">Due This Week</option>
          <option value="overdue">Overdue Tasks</option>
        </select>
      </div>

      {/* Content area */}
      {loading && tasks.length === 0 ? (
        <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '40px' }}>Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Info size={32} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <h3>No tasks found</h3>
          <p style={{ fontSize: '0.9rem', marginTop: '6px' }}>Try clearing filters or create a new task.</p>
        </div>
      ) : viewMode === 'list' ? (
        /* LIST VIEW */
        <div className="glass-card" style={{ padding: '8px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                {['Task', 'Status', 'Priority', 'Deadline', 'Assigned To', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '16px 20px', textAlign: i === 5 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: task.status === 'completed' ? 0.75 : 1 }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <strong style={{ fontSize: '0.95rem', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>{task.title}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{task.team_name ? `Team: ${task.team_name}` : 'Personal'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`badge badge-${task.status === 'in_progress' ? 'progress' : task.status}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: isOverdue(task) ? 'var(--priority-high)' : 'var(--text-secondary)', fontWeight: isOverdue(task) ? 600 : 400 }}>
                      <Calendar size={14} />
                      <span>{formatDate(task.deadline) || 'No deadline'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {task.assignee_username
                      ? <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /><span>{task.assignee_username}</span></div>
                      : <span>—</span>}
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {task.status !== 'completed' && (
                        <button className="theme-toggle" onClick={() => handleQuickStatusChange(task, 'completed')} title="Mark complete" style={{ color: 'var(--priority-low)' }}>
                          <Check size={16} />
                        </button>
                      )}
                      <button className="theme-toggle" onClick={() => openEditModal(task)} title="Edit"><Edit2 size={16} /></button>
                      <button className="theme-toggle" onClick={() => handleDeleteTask(task.id)} title="Delete" style={{ color: 'var(--priority-high)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* KANBAN VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
          {KANBAN_COLUMNS.map(({ key, label, color }) => {
            const columnTasks = getTasksByStatus(key);
            return (
              <div key={key} className="glass-card" style={{ padding: '20px', backgroundColor: 'rgba(21,27,44,0.2)', borderTop: `4px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }}></span>
                    {label}
                  </h3>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)' }}>
                    {columnTasks.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: '150px' }}>
                  {columnTasks.length === 0 ? (
                    <div style={{ padding: '30px 10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1.5px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                      No tasks in this stage
                    </div>
                  ) : columnTasks.map((task) => (
                    <div key={task.id} className="glass-card" style={{
                      padding: '16px', backgroundColor: 'var(--bg-secondary)',
                      border: isOverdue(task) ? '1.5px solid rgba(239,68,68,0.3)' : '1px solid var(--border-color)',
                      boxShadow: 'var(--shadow-sm)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                          {task.team_name ? `Team: ${task.team_name}` : 'Personal'}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '6px', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {task.description}
                        </p>
                      )}

                      <div style={{ borderBottom: '1px solid var(--border-color)', marginBottom: '12px' }}></div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: isOverdue(task) ? 'var(--priority-high)' : 'var(--text-muted)', fontWeight: isOverdue(task) ? 700 : 500 }}>
                          <Calendar size={12} />
                          <span>{formatDate(task.deadline) || 'No deadline'}</span>
                        </div>
                        {task.assignee_username && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>
                            <User size={10} /><span>{task.assignee_username}</span>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {key === 'pending' && (
                            <button className="btn-secondary" onClick={() => handleQuickStatusChange(task, 'in_progress')}
                              style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span>Start</span><ChevronRight size={10} />
                            </button>
                          )}
                          {key === 'in_progress' && (
                            <button className="btn-secondary" onClick={() => handleQuickStatusChange(task, 'completed')}
                              style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span>Complete</span><Check size={10} />
                            </button>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="theme-toggle" onClick={() => openEditModal(task)} style={{ padding: '4px' }}><Edit2 size={12} /></button>
                          <button className="theme-toggle" onClick={() => handleDeleteTask(task.id)} style={{ padding: '4px', color: 'var(--priority-high)' }}><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTask ? 'Edit Task' : 'Create Task'}</h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleFormSubmit}>
              <div className="modal-body">
                {formError && (
                  <div style={{ backgroundColor: 'var(--priority-high-bg)', color: 'var(--priority-high)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {formError}
                  </div>
                )}

                <div className="form-group">
                  <label>Task Title *</label>
                  <input type="text" className="form-control" placeholder="e.g. Design Landing Page"
                    value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" rows="3" placeholder="Provide details about the task..."
                    value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Priority</label>
                    <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Deadline / Due Date</label>
                  <input type="datetime-local" className="form-control" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Assign to Team (Optional)</label>
                    <select className="form-control" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
                      <option value="">Personal Task (No Team)</option>
                      {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  {teamId && (
                    <div className="form-group">
                      <label>Assignee (Optional)</label>
                      <select className="form-control" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                        <option value="">Unassigned</option>
                        {teamMembers.map((m) => <option key={m.id} value={m.id}>{m.username}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingTask ? 'Save Changes' : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Tasks;
