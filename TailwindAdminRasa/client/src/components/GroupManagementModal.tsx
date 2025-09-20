import { useState } from 'react';
import { 
  X, Users, Plus, Edit, Trash2, Settings, Target, 
  Shield, Zap, TrendingUp, AlertCircle, CheckCircle
} from 'lucide-react';
import { AccountGroup, SocialAccount } from '../../../shared/schema';

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: AccountGroup[];
  socialAccounts: SocialAccount[];
  groupLimits?: any;
  onRefresh: () => void;
}

export function GroupManagementModal({
  isOpen,
  onClose,
  groups,
  socialAccounts,
  groupLimits,
  onRefresh
}: GroupManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'assign'>('overview');
  const [editingGroup, setEditingGroup] = useState<AccountGroup | null>(null);

  // Group management functions
  const handleEditGroup = (group: AccountGroup) => {
    setEditingGroup(group);
    setActiveTab('create'); // Reuse create form for editing
  };

  const handleDeleteGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa group "${groupName}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/analytics/groups/${groupId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete group');
      }

      onRefresh();
      alert(`Group "${groupName}" đã được xóa thành công!`);
    } catch (error) {
      console.error('Error deleting group:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Không thể xóa group'}`);
    }
  };

  const handleAssignAccountToGroup = async (accountId: string, groupId: string) => {
    try {
      // TODO: Implement account-to-group assignment API when group_accounts table is ready
      const response = await fetch('/api/analytics/groups/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          socialAccountId: accountId,
          groupId: groupId,
          weight: 1.0,
          isActive: true
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to assign account to group');
      }

      onRefresh();
      alert('Account đã được gán vào group thành công!');
    } catch (error) {
      console.error('Error assigning account to group:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Không thể gán account vào group'}`);
    }
  };

  if (!isOpen) return null;

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'text-red-600 bg-red-100';
      case 2: return 'text-orange-600 bg-orange-100';
      case 3: return 'text-yellow-600 bg-yellow-100';
      case 4: return 'text-blue-600 bg-blue-100';
      case 5: return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getGroupLimitsInfo = (groupId: string) => {
    if (!groupLimits?.byScope?.group) return null;
    return groupLimits.byScope.group.find((limit: any) => limit.groupId === groupId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quản Lý Account Groups</h2>
              <p className="text-sm text-gray-600">Tổ chức và quản lý các nhóm tài khoản với giới hạn thông minh</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Tổng Quan Groups
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'create'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Plus className="w-4 h-4 inline mr-2" />
            Tạo Group Mới
          </button>
          <button
            onClick={() => setActiveTab('assign')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'assign'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Target className="w-4 h-4 inline mr-2" />
            Gán Accounts
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Groups Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => {
                  const limitsInfo = getGroupLimitsInfo(group.id);
                  
                  return (
                    <div key={group.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{group.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{group.description || 'Không có mô tả'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(group.priority || 3)}`}>
                            P{group.priority || 3}
                          </span>
                          <button
                            onClick={() => handleEditGroup(group)}
                            className="p-1 hover:bg-gray-100 rounded"
                            title="Edit group"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group.id, group.name)}
                            className="p-1 hover:bg-gray-100 rounded text-red-500"
                            title="Delete group"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Group Stats */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Weight:</span>
                          <span className="font-medium">{group.weight}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Posts:</span>
                          <span className="font-medium">{group.totalPosts || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${group.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {group.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      {/* Limits Info */}
                      {limitsInfo && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <h4 className="text-xs font-medium text-gray-700 mb-2">Current Limits</h4>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              limitsInfo.usagePercent > 90 ? 'bg-red-500' : 
                              limitsInfo.usagePercent > 70 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}></div>
                            <span className="text-xs">
                              {limitsInfo.used}/{limitsInfo.limit} ({limitsInfo.window})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Add New Group Card */}
                <div
                  onClick={() => setActiveTab('create')}
                  className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-600">Tạo Group Mới</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div className="max-w-2xl mx-auto">
              <GroupCreateForm onRefresh={onRefresh} onCancel={() => setActiveTab('overview')} />
            </div>
          )}

          {activeTab === 'assign' && (
            <div className="max-w-4xl mx-auto">
              <AccountAssignmentPanel 
                groups={groups} 
                socialAccounts={socialAccounts} 
                onRefresh={onRefresh}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Group Create Form Component
function GroupCreateForm({ onRefresh, onCancel }: { onRefresh: () => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    priority: 3,
    weight: 1.0,
    isActive: true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create new group via analytics API (since this is where groups are managed)
      const response = await fetch('/api/analytics/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          platform: 'facebook' // Default platform
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create group');
      }
      
      // Refresh data and close form
      onRefresh();
      onCancel();
      alert('Group đã được tạo thành công!');
    } catch (error) {
      console.error('Error creating group:', error);
      alert(`Lỗi: ${error instanceof Error ? error.message : 'Không thể tạo group'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tên Group</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="VD: Group VIP, Group Thường..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          rows={3}
          placeholder="Mô tả mục đích và quy tắc của group..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority (1-5)</label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={1}>1 - Cao nhất</option>
            <option value={2}>2 - Cao</option>
            <option value={3}>3 - Trung bình</option>
            <option value={4}>4 - Thấp</option>
            <option value={5}>5 - Thấp nhất</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Weight</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            max="10"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isActive" className="text-sm text-gray-700">Group hoạt động</label>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Tạo Group
        </button>
      </div>
    </form>
  );
}

// Account Assignment Panel Component
function AccountAssignmentPanel({ 
  groups, 
  socialAccounts, 
  onRefresh 
}: { 
  groups: AccountGroup[]; 
  socialAccounts: SocialAccount[]; 
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">Gán Accounts vào Groups</h3>
        <p className="text-sm text-gray-600 mt-1">
          Quản lý việc phân bổ tài khoản social media vào các groups để tối ưu hóa đăng bài
        </p>
      </div>

      {/* TODO: Implement account assignment UI */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            Account Assignment UI - Đang phát triển
          </span>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          Tính năng gán accounts vào groups sẽ được hoàn thiện trong phiên bản tiếp theo.
        </p>
      </div>
    </div>
  );
}