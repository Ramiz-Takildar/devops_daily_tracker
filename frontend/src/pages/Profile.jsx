import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Lock, 
  Camera, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Shield,
  Award,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/common/PageHeader';
import toast from 'react-hot-toast';
import api from '../services/api';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar: null,
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [stats, setStats] = useState({
    totalHours: 0,
    toolsUsed: 0,
    currentStreak: 0,
    joinedDate: null,
  });

  useEffect(() => {
    fetchProfileData();
    fetchStats();
  }, []);

  const fetchProfileData = async () => {
    try {
      const response = await api.get('/auth/profile');
      const data = response.data.user;
      setProfileData({
        username: data.username || '',
        email: data.email || '',
        bio: data.bio || '',
        avatar: data.avatar || null,
      });
      setAvatarPreview(data.avatar);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Use auth context data as fallback
      setProfileData({
        username: user?.username || '',
        email: user?.email || '',
        bio: '',
        avatar: null,
      });
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      const data = response.data.stats;
      setStats({
        totalHours: data.total_hours || 0,
        toolsUsed: data.tools_used || 0,
        currentStreak: data.current_streak || 0,
        joinedDate: user?.created_at || new Date().toISOString(),
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
    setHasChanges(true);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setProfileData(prev => ({ ...prev, avatar: reader.result }));
        setHasChanges(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setProfileData(prev => ({ ...prev, avatar: null }));
    setHasChanges(true);
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await api.put('/auth/profile', {
        username: profileData.username,
        email: profileData.email,
        bio: profileData.bio,
        avatar: profileData.avatar,
      });
      
      if (updateUser) {
        updateUser(response.data.user);
      }
      
      toast.success('Profile updated successfully! ✅');
      setHasChanges(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast.success('Password changed successfully! 🔒');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    fetchProfileData();
    setHasChanges(false);
  };

  const getInitials = () => {
    if (!profileData.username) return 'DU';
    return profileData.username
      .split(' ')
      .map(part => part.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Profile"
        subtitle="Manage your personal information and preferences"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Profile Card & Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {/* Profile Card */}
          <div className="card p-6">
            <div className="flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="relative group mb-4">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-theme shadow-xl"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-4xl font-bold text-white border-4 border-theme shadow-xl">
                      {getInitials()}
                    </div>
                  )}
                  
                  {/* Edit Overlay */}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-8 h-8 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
                
                {avatarPreview && (
                  <button
                    onClick={handleRemoveAvatar}
                    className="absolute -top-2 -right-2 p-2 bg-rose-500 rounded-full text-white hover:bg-rose-600 transition-colors shadow-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <h3 className="text-xl font-bold text-theme mb-1">
                {profileData.username || 'DevOps User'}
              </h3>
              <p className="text-sm text-theme-muted mb-4">
                {profileData.email || 'user@example.com'}
              </p>

              {/* Level Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-full">
                <Award className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-theme">
                  Level {user?.level || 1}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-theme mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Your Progress
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-[color:var(--surface-soft)] rounded-xl">
                <span className="text-sm text-theme-muted">Total Hours</span>
                <span className="text-lg font-bold text-theme">{stats.totalHours}h</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[color:var(--surface-soft)] rounded-xl">
                <span className="text-sm text-theme-muted">Tools Used</span>
                <span className="text-lg font-bold text-theme">{stats.toolsUsed}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[color:var(--surface-soft)] rounded-xl">
                <span className="text-sm text-theme-muted">Current Streak</span>
                <span className="text-lg font-bold text-theme">{stats.currentStreak} days</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[color:var(--surface-soft)] rounded-xl">
                <span className="text-sm text-theme-muted flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Member Since
                </span>
                <span className="text-sm font-semibold text-theme">
                  {formatDate(stats.joinedDate)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right Column - Edit Forms */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Personal Information */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-theme mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-400" />
              Personal Information
            </h3>

            <div className="space-y-4">
              {/* Username */}
              <div className="form-group">
                <label htmlFor="username" className="label">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-theme-muted" />
                  </div>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={profileData.username}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="Your username"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="label">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-theme-muted" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleInputChange}
                    className="input pl-10"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              {/* Bio */}
              <div className="form-group">
                <label htmlFor="bio" className="label">
                  Bio (Optional)
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  className="input"
                  rows="4"
                  placeholder="Tell us about yourself..."
                  maxLength="500"
                />
                <p className="text-xs text-theme-muted mt-1">
                  {profileData.bio.length}/500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={loading || !hasChanges}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading || !hasChanges}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-theme mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-rose-400" />
              Security
            </h3>

            <div className="space-y-4">
              {/* Current Password */}
              <div className="form-group">
                <label htmlFor="currentPassword" className="label">
                  Current Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-theme-muted" />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-muted hover:text-theme"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label htmlFor="newPassword" className="label">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-theme-muted" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-muted hover:text-theme"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="label">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-theme-muted" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className="input pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-theme-muted hover:text-theme"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Change Password Button */}
              <button
                onClick={handleChangePassword}
                disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Changing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Change Password</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
