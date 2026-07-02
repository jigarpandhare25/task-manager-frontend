import React, { useState, useEffect } from 'react';
import { Users, Plus, Mail, LogOut, Trash2, X, PlusCircle, CheckSquare, Clock } from 'lucide-react';
import { teamsApi, tasksApi } from '../api';

function Teams({ token, currentUser }) {
  const [teams, setTeams]               = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [members, setMembers]           = useState([]);
  const [teamTasks, setTeamTasks]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [newTeamName, setNewTeamName]           = useState('');
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [error, setError]               = useState('');
  const [inviteError, setInviteError]   = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => { loadTeams(); }, [token]);
  useEffect(() => { if (selectedTeam) loadTeamDetails(selectedTeam.id); }, [selectedTeam]);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await teamsApi.getAll(token);
      setTeams(data);
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamDetails = async (teamId) => {
    setDetailsLoading(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      // Fetch members and tasks in parallel — both are needed to render the detail pane
      const [membersData, tasksData] = await Promise.all([
        teamsApi.getMembers(token, teamId),
        tasksApi.getAll(token, { teamId }),
      ]);
      setMembers(membersData);
      setTeamTasks(tasksData);
    } catch (err) {
      console.error('Error loading team details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    setError('');
    if (!newTeamName.trim()) { setError('Team name is required'); return; }

    try {
      const data = await teamsApi.create(token, newTeamName.trim());
      setNewTeamName('');
      setIsCreateModalOpen(false);
      setTeams((prev) => [data, ...prev]);
      setSelectedTeam(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    if (!inviteIdentifier.trim()) { setInviteError('Please enter a username or email'); return; }

    try {
      const data = await teamsApi.addMember(token, selectedTeam.id, inviteIdentifier.trim());
      setInviteSuccess(data.message);
      setInviteIdentifier('');
      loadTeamDetails(selectedTeam.id);
      setTeams((prev) => prev.map((t) => t.id === selectedTeam.id ? { ...t, members_count: t.members_count + 1 } : t));
    } catch (err) {
      setInviteError(err.message);
    }
  };

  const handleRemoveMember = async (targetUserId, targetUsername) => {
    const isSelf = targetUserId === currentUser.id;
    const msg = isSelf
      ? 'Are you sure you want to leave this team?'
      : `Remove ${targetUsername} from the team?`;
    if (!window.confirm(msg)) return;

    try {
      await teamsApi.removeMember(token, selectedTeam.id, targetUserId);
      if (isSelf) {
        setSelectedTeam(null);
        loadTeams();
      } else {
        loadTeamDetails(selectedTeam.id);
        setTeams((prev) => prev.map((t) => t.id === selectedTeam.id ? { ...t, members_count: t.members_count - 1 } : t));
      }
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selectedTeam ? '350px 1fr' : '1fr', gap: '28px', alignItems: 'start' }}>

      {/* Team list */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '4px' }}>Teams</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Collaborate with team spaces.</p>
          </div>
          <button className="theme-toggle" onClick={() => setIsCreateModalOpen(true)}
            style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-color)', borderRadius: 'var(--radius-sm)', padding: '8px' }}>
            <Plus size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Users size={32} style={{ marginBottom: '12px' }} />
            <h4>No teams yet</h4>
            <p style={{ fontSize: '0.8rem', marginTop: '6px' }}>Create a team to collaborate on tasks.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {teams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              return (
                <div key={team.id} className="glass-card" onClick={() => setSelectedTeam(team)}
                  style={{ padding: '20px', cursor: 'pointer', backgroundColor: isSelected ? 'var(--accent-light)' : 'var(--bg-secondary)', borderColor: isSelected ? 'var(--accent-color)' : 'var(--border-color)', transition: 'all var(--transition-fast)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '8px', color: isSelected ? 'var(--accent-color)' : 'var(--text-primary)' }}>
                    {team.name}
                  </h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span>Owner: <strong>{team.owner_username}</strong></span>
                    <span>{team.members_count} Members</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Team detail pane */}
      {selectedTeam && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Active Workspace</span>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '2px' }}>{selectedTeam.name}</h2>
              </div>
              {selectedTeam.owner_id !== currentUser.id && (
                <button className="btn-danger" onClick={() => handleRemoveMember(currentUser.id, currentUser.username)}>
                  <LogOut size={16} /><span>Leave Team</span>
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'start' }}>
            {/* Members */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Team Members</h3>

              <form onSubmit={handleInvite} style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Invite New Member
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Mail size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="form-control" placeholder="Username or email"
                      value={inviteIdentifier} onChange={(e) => setInviteIdentifier(e.target.value)}
                      style={{ paddingLeft: '36px', height: '38px' }} />
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '0 16px', height: '38px' }}>
                    <PlusCircle size={16} />
                  </button>
                </div>
                {inviteError   && <p style={{ color: 'var(--priority-high)', fontSize: '0.75rem', fontWeight: 600, marginTop: '6px' }}>{inviteError}</p>}
                {inviteSuccess && <p style={{ color: 'var(--priority-low)',  fontSize: '0.75rem', fontWeight: 600, marginTop: '6px' }}>{inviteSuccess}</p>}
              </form>

              {detailsLoading ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading members...</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {members.map((member) => {
                    const isOwner   = member.id === selectedTeam.owner_id;
                    const canRemove = selectedTeam.owner_id === currentUser.id && member.id !== currentUser.id;
                    return (
                      <div key={member.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: isOwner ? 'var(--accent-hover)' : 'var(--bg-tertiary)', color: isOwner ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700 }}>
                            {member.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{member.username}{member.id === currentUser.id && ' (You)'}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{member.email}</span>
                          </div>
                        </div>
                        {isOwner ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', backgroundColor: 'var(--accent-light)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, textTransform: 'uppercase' }}>Owner</span>
                        ) : canRemove ? (
                          <button className="theme-toggle" onClick={() => handleRemoveMember(member.id, member.username)} style={{ color: 'var(--priority-high)' }} title="Remove Member">
                            <Trash2 size={14} />
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Team tasks */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckSquare size={18} style={{ color: 'var(--accent-color)' }} />
                Team Tasks ({teamTasks.length})
              </h3>

              {detailsLoading ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading tasks...</div>
              ) : teamTasks.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', border: '1.5px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  No tasks assigned to this team yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {teamTasks.map((task) => (
                    <div key={task.id} style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', opacity: task.status === 'completed' ? 0.75 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '0.9rem', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>{task.title}</strong>
                        <span className={`badge badge-${task.status === 'in_progress' ? 'progress' : task.status}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                      {task.description && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>{task.description}</p>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
                          <Clock size={12} />
                          <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</span>
                        </div>
                        {task.assignee_username && (
                          <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Assigned to: {task.assignee_username}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Team</h3>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTeam}>
              <div className="modal-body">
                {error && (
                  <div style={{ backgroundColor: 'var(--priority-high-bg)', color: 'var(--priority-high)', padding: '10px 14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
                    {error}
                  </div>
                )}
                <div className="form-group">
                  <label>Team Name *</label>
                  <input type="text" className="form-control" placeholder="e.g. Marketing, Frontend Engineers"
                    value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsCreateModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Team</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Teams;
