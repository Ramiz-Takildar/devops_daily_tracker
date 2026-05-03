import { Settings, Sparkles, Bell, Shield, Database, Palette } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';

const AdminSettings = () => {
  const settingsSections = [
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure system notifications and alerts',
      status: 'Coming Soon',
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-100'
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Manage authentication and access control',
      status: 'Coming Soon',
      gradient: 'from-red-500 to-red-600',
      bg: 'bg-red-100'
    },
    {
      icon: Database,
      title: 'Database',
      description: 'Database backup and maintenance settings',
      status: 'Coming Soon',
      gradient: 'from-green-500 to-green-600',
      bg: 'bg-green-100'
    },
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize platform branding and themes',
      status: 'Coming Soon',
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <PageHeader
          badge="System Configuration"
          badgeIcon={Sparkles}
          title="Platform settings"
          highlightText="and preferences"
          subtitle="Configure system-wide settings, security, notifications, and platform customization options."
          pattern="gradient"
        />

        {/* Settings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settingsSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-6 hover:shadow-lg hover:scale-[1.02] transition-all">
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${section.gradient} shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                        {section.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{section.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Placeholder Message */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-md p-12">
          <div className="text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Settings Configuration
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Advanced settings and configuration options will be available here. Stay tuned for updates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
